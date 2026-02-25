# Surgical Context: agent0ai/agent-zero
**Date**: 2026-02-16_13-15
**Source**: https://github.com/agent0ai/agent-zero

---

## FILE: agent.py
```
import asyncio, random, string, threading
import nest_asyncio

nest_asyncio.apply()

from collections import OrderedDict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Awaitable, Coroutine, Dict, Literal
from enum import Enum
import models

from python.helpers import (
    extract_tools,
    files,
    errors,
    history,
    tokens,
    context as context_helper,
    dirty_json,
    subagents
)
from python.helpers.print_style import PrintStyle

from langchain_core.prompts import (
    ChatPromptTemplate,
)
from langchain_core.messages import SystemMessage, BaseMessage

import python.helpers.log as Log
from python.helpers.dirty_json import DirtyJson
from python.helpers.defer import DeferredTask
from typing import Callable
from python.helpers.localization import Localization
from python.helpers.extension import call_extensions
from python.helpers.errors import RepairableException


class AgentContextType(Enum):
    USER = "user"
    TASK = "task"
    BACKGROUND = "background"


class AgentContext:

    _contexts: dict[str, "AgentContext"] = {}
    _contexts_lock = threading.RLock()
    _counter: int = 0
    _notification_manager = None

    def __init__(
        self,
        config: "AgentConfig",
        id: str | None = None,
        name: str | None = None,
        agent0: "Agent|None" = None,
        log: Log.Log | None = None,
        paused: bool = False,
        streaming_agent: "Agent|None" = None,
        created_at: datetime | None = None,
        type: AgentContextType = AgentContextType.USER,
        last_message: datetime | None = None,
        data: dict | None = None,
        output_data: dict | None = None,
        set_current: bool = False,
    ):
        # initialize context
        self.id = id or AgentContext.generate_id()
        existing = None
        with AgentContext._contexts_lock:
            existing = AgentContext._contexts.get(self.id, None)
            if existing:
                AgentContext._contexts.pop(self.id, None)
            AgentContext._contexts[self.id] = self
        if existing and existing.task:
            existing.task.kill()
        if set_current:
            AgentContext.set_current(self.id)

        # initialize state
        self.name = name
        self.config = config
        self.data = data or {}
        self.output_data = output_data or {}
        self.log = log or Log.Log()
        self.log.context = self
        self.paused = paused
        self.streaming_agent = streaming_agent
        self.task: DeferredTask | None = None
        self.created_at = created_at or datetime.now(timezone.utc)
        self.type = type
        AgentContext._counter += 1
        self.no = AgentContext._counter
        self.last_message = last_message or datetime.now(timezone.utc)

        # initialize agent at last (context is complete now)
        self.agent0 = agent0 or Agent(0, self.config, self)

    @staticmethod
    def get(id: str):
        with AgentContext._contexts_lock:
            return AgentContext._contexts.get(id, None)

    @staticmethod
    def use(id: str):
        context = AgentContext.get(id)
        if context:
            AgentContext.set_current(id)
        else:
            AgentContext.set_current("")
        return context

    @staticmethod
    def current():
        ctxid = context_helper.get_context_data("agent_context_id", "")
        if not ctxid:
            return None
        return AgentContext.get(ctxid)

    @staticmethod
    def set_current(ctxid: str):
        context_helper.set_context_data("agent_context_id", ctxid)

    @staticmethod
    def first():
        with AgentContext._contexts_lock:
            if not AgentContext._contexts:
                return None
            return list(AgentContext._contexts.values())[0]

    @staticmethod
    def all():
        with AgentContext._contexts_lock:
            return list(AgentContext._contexts.values())

    @staticmethod
    def generate_id():
        def generate_short_id():
            return "".join(random.choices(string.ascii_letters + string.digits, k=8))

        while True:
            short_id = generate_short_id()
            with AgentContext._contexts_lock:
                if short_id not in AgentContext._contexts:
                    return short_id

    @classmethod
    def get_notification_manager(cls):
        if cls._notification_manager is None:
            from python.helpers.notification import NotificationManager  # type: ignore

            cls._notification_manager = NotificationManager()
        return cls._notification_manager

    @staticmethod
    def remove(id: str):
        with AgentContext._contexts_lock:
            context = AgentContext._contexts.pop(id, None)
        if context and context.task:
            context.task.kill()
        return context

    def get_data(self, key: str, recursive: bool = True):
        # recursive is not used now, prepared for context hierarchy
        return self.data.get(key, None)

    def set_data(self, key: str, value: Any, recursive: bool = True):
        # recursive is not used now, prepared for context hierarchy
        self.data[key] = value

    def get_output_data(self, key: str, recursive: bool = True):
        # recursive is not used now, prepared for context hierarchy
        return self.output_data.get(key, None)

    def set_output_data(self, key: str, value: Any, recursive: bool = True):
        # recursive is not used now, prepared for context hierarchy
        self.output_data[key] = value

    def output(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_at": (
                Localization.get().serialize_datetime(self.created_at)
                if self.created_at
                else Localization.get().serialize_datetime(datetime.fromtimestamp(0))
            ),
            "no": self.no,
            "log_guid": self.log.guid,
            "log_version": len(self.log.updates),
            "log_length": len(self.log.logs),
            "paused": self.paused,
            "last_message": (
                Localization.get().serialize_datetime(self.last_message)
                if self.last_message
                else Localization.get().serialize_datetime(datetime.fromtimestamp(0))
            ),
            "type": self.type.value,
            "running": self.is_running(),
            **self.output_data,
        }

    @staticmethod
    def log_to_all(
        type: Log.Type,
        heading: str | None = None,
        content: str | None = None,
        kvps: dict | None = None,
        update_progress: Log.ProgressUpdate | None = None,
        id: str | None = None,  # Add id parameter
        **kwargs,
    ) -> list[Log.LogItem]:
        items: list[Log.LogItem] = []
        for context in AgentContext.all():
            items.append(
                context.log.log(
                    type, heading, content, kvps, update_progress, id, **kwargs
                )
            )
        return items

    def kill_process(self):
        if self.task:
            self.task.kill()

    def reset(self):
        self.kill_process()
        self.log.reset()
        self.agent0 = Agent(0, self.config, self)
        self.streaming_agent = None
        self.paused = False

    def nudge(self):
        self.kill_process()
        self.paused = False
        self.task = self.communicate(UserMessage(self.agent0.read_prompt("fw.msg_nudge.md")))
        return self.task

    def get_agent(self):
        return self.streaming_agent or self.agent0

    def is_running(self) -> bool:
        return (self.task and self.task.is_alive()) or False

    def communicate(self, msg: "UserMessage", broadcast_level: int = 1):
        self.paused = False  # unpause if paused

        current_agent = self.get_agent()

        if self.task and self.task.is_alive():
            # set intervention messages to agent(s):
            intervention_agent = current_agent
            while intervention_agent and broadcast_level != 0:
                intervention_agent.intervention = msg
                broadcast_level -= 1
                intervention_agent = intervention_agent.data.get(
                    Agent.DATA_NAME_SUPERIOR, None
                )
        else:
            self.task = self.run_task(self._process_chain, current_agent, msg)

        return self.task

    def run_task(
        self, func: Callable[..., Coroutine[Any, Any, Any]], *args: Any, **kwargs: Any
    ):
        if not self.task:
            self.task = DeferredTask(
                thread_name=self.__class__.__name__,
            )
        self.task.start_task(func, *args, **kwargs)
        return self.task

    # this wrapper ensures that superior agents are called back if the chat was loaded from file and original callstack is gone
    async def _process_chain(self, agent: "Agent", msg: "UserMessage|str", user=True):
        try:
            msg_template = (
                agent.hist_add_user_message(msg)  # type: ignore
                if user
                else agent.hist_add_tool_result(
                    tool_name="call_subordinate", tool_result=msg  # type: ignore
                )
            )
            response = await agent.monologue()  # type: ignore
            superior = agent.data.get(Agent.DATA_NAME_SUPERIOR, None)
            if superior:
                response = await self._process_chain(superior, response, False)  # type: ignore

            # call end of process extensions
            await self.get_agent().call_extensions("process_chain_end", data={})

            return response
        except Exception as e:
            agent.handle_critical_exception(e)


@dataclass
class AgentConfig:
    chat_model: models.ModelConfig
    utility_model: models.ModelConfig
    embeddings_model: models.ModelConfig
    browser_model: models.ModelConfig
    mcp_servers: str
    profile: str = ""
    memory_subdir: str = ""
    knowledge_subdirs: list[str] = field(default_factory=lambda: ["default", "custom"])
    browser_http_headers: dict[str, str] = field(
        default_factory=dict
    )  # Custom HTTP headers for browser requests
    code_exec_ssh_enabled: bool = True
    code_exec_ssh_addr: str = "localhost"
    code_exec_ssh_port: int = 55022
    code_exec_ssh_user: str = "root"
    code_exec_ssh_pass: str = ""
    additional: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UserMessage:
    message: str
    attachments: list[str] = field(default_factory=list[str])
    system_message: list[str] = field(default_factory=list[str])


class LoopData:
    def __init__(self, **kwargs):
        self.iteration = -1
        self.system = []
        self.user_message: history.Message | None = None
        self.history_output: list[history.OutputMessage] = []
        self.extras_temporary: OrderedDict[str, history.MessageContent] = OrderedDict()
        self.extras_persistent: OrderedDict[str, history.MessageContent] = OrderedDict()
        self.last_response = ""
        self.params_temporary: dict = {}
        self.params_persistent: dict = {}
        self.current_tool = None

        # override values with kwargs
        for key, value in kwargs.items():
            setattr(self, key, value)


# intervention exception class - skips rest of message loop iteration
class InterventionException(Exception):
    pass


# killer exception class - not forwarded to LLM, cannot be fixed on its own, ends message loop


class HandledException(Exception):
    pass


class Agent:

    DATA_NAME_SUPERIOR = "_superior"
    DATA_NAME_SUBORDINATE = "_subordinate"
    DATA_NAME_CTX_WINDOW = "ctx_window"

    def __init__(
        self, number: int, config: AgentConfig, context: AgentContext | None = None
    ):

        # agent config
        self.config = config

        # agent context
        self.context = context or AgentContext(config=config, agent0=self)

        # non-config vars
        self.number = number
        self.agent_name = f"A{self.number}"

        self.history = history.History(self)  # type: ignore[abstract]
        self.last_user_message: history.Message | None = None
        self.intervention: UserMessage | None = None
        self.data: dict[str, Any] = {}  # free data object all the tools can use

        asyncio.run(self.call_extensions("agent_init"))

    async def monologue(self):
        error_retries = 0  # counter for critical error retries
        while True:
            try:
                # loop data dictionary to pass to extensions
                self.loop_data = LoopData(user_message=self.last_user_message)
                # call monologue_start extensions
                await self.call_extensions("monologue_start", loop_data=self.loop_data)

                printer = PrintStyle(italic=True, font_color="#b3ffd9", padding=False)

                # let the agent run message loop until he stops it with a response tool
                while True:

                    self.context.streaming_agent = self  # mark self as current streamer
                    self.loop_data.iteration += 1
                    self.loop_data.params_temporary = {}  # clear temporary params

                    # call message_loop_start extensions
                    await self.call_extensions(
                        "message_loop_start", loop_data=self.loop_data
                    )
                    await self.handle_intervention()

                    try:
                        # prepare LLM chain (model, system, history)
                        prompt = await self.prepare_prompt(loop_data=self.loop_data)

                        # call before_main_llm_call extensions
                        await self.call_extensions(
                            "before_main_llm_call", loop_data=self.loop_data
                        )
                        await self.handle_intervention()


                        async def reasoning_callback(chunk: str, full: str):
                            await self.handle_intervention()
                            if chunk == full:
                                printer.print("Reasoning: ")  # start of reasoning
                            # Pass chunk and full data to extensions for processing
                            stream_data = {"chunk": chunk, "full": full}
                            await self.call_extensions(
                                "reasoning_stream_chunk",
                                loop_data=self.loop_data,
                                stream_data=stream_data,
                            )
                            # Stream masked chunk after extensions processed it
                            if stream_data.get("chunk"):
                                printer.stream(stream_data["chunk"])
                            # Use the potentially modified full text for downstream processing
                            await self.handle_reasoning_stream(stream_data["full"])

                        async def stream_callback(chunk: str, full: str):
                            await self.handle_intervention()
                            # output the agent response stream
                            if chunk == full:
                                printer.print("Response: ")  # start of response
                            # Pass chunk and full data to extensions for processing
                            stream_data = {"chunk": chunk, "full": full}
                            await self.call_extensions(
                                "response_stream_chunk",
                                loop_data=self.loop_data,
                                stream_data=stream_data,
                            )
                            # Stream masked chunk after extensions processed it
                            if stream_data.get("chunk"):
                                printer.stream(stream_data["chunk"])
                            # Use the potentially modified full text for downstream processing
                            await self.handle_response_stream(stream_data["full"])

                        # call main LLM
                        agent_response, _reasoning = await self.call_chat_model(
                            messages=prompt,
                            response_callback=stream_callback,
                            reasoning_callback=reasoning_callback,
                        )
                        await self.handle_intervention(agent_response)

                        # Notify extensions to finalize their stream filters
                        await self.call_extensions(
                            "reasoning_stream_end", loop_data=self.loop_data
                        )
                        await self.handle_intervention(agent_response)

                        await self.call_extensions(
                            "response_stream_end", loop_data=self.loop_data
                        )

                        await self.handle_intervention(agent_response)

                        if (
                            self.loop_data.last_response == agent_response
                        ):  # if assistant_response is the same as last message in history, let him know
                            # Append the assistant's response to the history
                            self.hist_add_ai_response(agent_response)
                            # Append warning message to the history
                            warning_msg = self.read_prompt("fw.msg_repeat.md")
                            self.hist_add_warning(message=warning_msg)
                            PrintStyle(font_color="orange", padding=True).print(
                                warning_msg
                            )
                            self.context.log.log(type="warning", content=warning_msg)

                        else:  # otherwise proceed with tool
                            # Append the assistant's response to the history
                            self.hist_add_ai_response(agent_response)
                            # process tools requested in agent message
                            tools_result = await self.process_tools(agent_response)
                            if tools_result:  # final response of message loop available
                                return tools_result  # break the execution if the task is done

                    # exceptions inside message loop:
                    except InterventionException as e:
                        error_retries = 0  # reset retry counter on user intervention
                        pass  # intervention message has been handled in handle_intervention(), proceed with conversation loop
                    except RepairableException as e:
                        # Forward repairable errors to the LLM, maybe it can fix them
                        msg = {"message": errors.format_error(e)}
                        await self.call_extensions("error_format", msg=msg)
                        self.hist_add_warning(msg["message"])
                        PrintStyle(font_color="red", padding=True).print(msg["message"])
                        self.context.log.log(type="warning", content=msg["message"])
                    except Exception as e:
                        # Retry critical exceptions before failing
                        error_retries = await self.retry_critical_exception(
                            e, error_retries
                        )

                    finally:
                        # call message_loop_end extensions
                        if self.context.task and self.context.task.is_alive(): # don't call extensions post mortem
                            await self.call_extensions(
                                "message_loop_end", loop_data=self.loop_data
                            )

            # exceptions outside message loop:
            except InterventionException as e:
                error_retries = 0  # reset retry counter on user intervention
                pass  # just start over
            except Exception as e:
                # Retry critical exceptions before failing
                error_retries = await self.retry_critical_exception(
                    e, error_retries
                )
            finally:
                self.context.streaming_agent = None  # unset current streamer
                # call monologue_end extensions
                if self.context.task and self.context.task.is_alive(): # don't call extensions post mortem
                    await self.call_extensions("monologue_end", loop_data=self.loop_data)  # type: ignore

    async def prepare_prompt(self, loop_data: LoopData) -> list[BaseMessage]:
        self.context.log.set_progress("Building prompt")

        # call extensions before setting prompts
        await self.call_extensions("message_loop_prompts_before", loop_data=loop_data)

        # set system prompt and message history
        loop_data.system = await self.get_system_prompt(self.loop_data)
        loop_data.history_output = self.history.output()

        # and allow extensions to edit them
        await self.call_extensions("message_loop_prompts_after", loop_data=loop_data)

        # concatenate system prompt
        system_text = "\n\n".join(loop_data.system)

        # join extras
        extras = history.Message(  # type: ignore[abstract]
            False,
            content=self.read_prompt(
                "agent.context.extras.md",
                extras=dirty_json.stringify(
                    {**loop_data.extras_persistent, **loop_data.extras_temporary}
                ),
            ),
        ).output()
        loop_data.extras_temporary.clear()

        # convert history + extras to LLM format
        history_langchain: list[BaseMessage] = history.output_langchain(
            loop_data.history_output + extras
        )

        # build full prompt from system prompt, message history and extrS
        full_prompt: list[BaseMessage] = [
            SystemMessage(content=system_text),
            *history_langchain,
        ]
        full_text = ChatPromptTemplate.from_messages(full_prompt).format()

        # store as last context window content
        self.set_data(
            Agent.DATA_NAME_CTX_WINDOW,
            {
                "text": full_text,
                "tokens": tokens.approximate_tokens(full_text),
            },
        )

        return full_prompt

    async def retry_critical_exception(
        self, e: Exception, error_retries: int, delay: int = 3, max_retries: int = 1
    ) -> int:
        if error_retries >= max_retries:
            self.handle_critical_exception(e)

        error_message = errors.format_error(e)
        
        self.context.log.log(
            type="warning", heading="Critical error occurred, retrying...", content=error_message
        )
        PrintStyle(font_color="orange", padding=True).print(
            "Critical error occurred, retrying..."
        )
        await asyncio.sleep(delay)
        await self.handle_intervention()
        agent_facing_error = self.read_prompt(
            "fw.msg_critical_error.md", error_message=error_message
        )
        self.hist_add_warning(message=agent_facing_error)
        PrintStyle(font_color="orange", padding=True).print(
            agent_facing_error
        )
        return error_retries + 1

    def handle_critical_exception(self, exception: Exception):
        if isinstance(exception, HandledException):
            raise exception  # Re-raise the exception to kill the loop
        elif isinstance(exception, asyncio.CancelledError):
            # Handling for asyncio.CancelledError
            PrintStyle(font_color="white", background_color="red", padding=True).print(
                f"Context {self.context.id} terminated during message loop"
            )
            raise HandledException(
                exception
            )  # Re-raise the exception to cancel the loop
        else:
            # Handling for general exceptions
            error_text = errors.error_text(exception)
            error_message = errors.format_error(exception)

            # Mask secrets in error messages
            PrintStyle(font_color="red", padding=True).print(error_message)
            self.context.log.log(
                type="error",
                content=error_message,
            )
            PrintStyle(font_color="red", padding=True).print(
                f"{self.agent_name}: {error_text}"
            )

            raise HandledException(exception)  # Re-raise the exception to kill the loop

    async def get_system_prompt(self, loop_data: LoopData) -> list[str]:
        system_prompt: list[str] = []
        await self.call_extensions(
            "system_prompt", system_prompt=system_prompt, loop_data=loop_data
        )
        return system_prompt

    def parse_prompt(self, _prompt_file: str, **kwargs):
        dirs = subagents.get_paths(self, "prompts")
        prompt = files.parse_file(
            _prompt_file, _directories=dirs, _agent=self, **kwargs
        )
        return prompt

    def read_prompt(self, file: str, **kwargs) -> str:
        dirs = subagents.get_paths(self, "prompts")
        prompt = files.read_prompt_file(file, _directories=dirs, _agent=self, **kwargs)
        if files.is_full_json_template(prompt):
            prompt = files.remove_code_fences(prompt)
        return prompt

    def get_data(self, field: str):
        return self.data.get(field, None)

    def set_data(self, field: str, value):
        self.data[field] = value

    def hist_add_message(
        self, ai: bool, content: history.MessageContent, tokens: int = 0
    ):
        self.last_message = datetime.now(timezone.utc)
        # Allow extensions to process content before adding to history
        content_data = {"content": content}
        asyncio.run(
            self.call_extensions("hist_add_before", content_data=content_data, ai=ai)
        )
        return self.history.add_message(
            ai=ai, content=content_data["content"], tokens=tokens
        )

    def hist_add_user_message(self, message: UserMessage, intervention: bool = False):
        self.history.new_topic()  # user message starts a new topic in history

        # load message template based on intervention
        if intervention:
            content = self.parse_prompt(
                "fw.intervention.md",
                message=message.message,
                attachments=message.attachments,
                system_message=message.system_message,
            )
        else:
            content = self.parse_prompt(
                "fw.user_message.md",
                message=message.message,
                attachments=message.attachments,
                system_message=message.system_message,
            )

        # remove empty parts from template
        if isinstance(content, dict):
            content = {k: v for k, v in content.items() if v}

        # add to history
        msg = self.hist_add_message(False, content=content)  # type: ignore
        self.last_user_message = msg
        return msg

    def hist_add_ai_response(self, message: str):
        self.loop_data.last_response = message
        content = self.parse_prompt("fw.ai_response.md", message=message)
        return self.hist_add_message(True, content=content)

    def hist_add_warning(self, message: history.MessageContent):
        content = self.parse_prompt("fw.warning.md", message=message)
        return self.hist_add_message(False, content=content)

    def hist_add_tool_result(self, tool_name: str, tool_result: str, **kwargs):
        data = {
            "tool_name": tool_name,
            "tool_result": tool_result,
            **kwargs,
        }
        asyncio.run(self.call_extensions("hist_add_tool_result", data=data))
        return self.hist_add_message(False, content=data)

    def concat_messages(
        self, messages
    ):  # TODO add param for message range, topic, history
        return self.history.output_text(human_label="user", ai_label="assistant")

    def get_chat_model(self):
        return models.get_chat_model(
            self.config.chat_model.provider,
            self.config.chat_model.name,
            model_config=self.config.chat_model,
            **self.config.chat_model.build_kwargs(),
        )

    def get_utility_model(self):
        return models.get_chat_model(
            self.config.utility_model.provider,
            self.config.utility_model.name,
            model_config=self.config.utility_model,
            **self.config.utility_model.build_kwargs(),
        )

    def get_browser_model(self):
        return models.get_browser_model(
            self.config.browser_model.provider,
            self.config.browser_model.name,
            model_config=self.config.browser_model,
            **self.config.browser_model.build_kwargs(),
        )

    def get_embedding_model(self):
        return models.get_embedding_model(
            self.config.embeddings_model.provider,
            self.config.embeddings_model.name,
            model_config=self.config.embeddings_model,
            **self.config.embeddings_model.build_kwargs(),
        )

    async def call_utility_model(
        self,
        system: str,
        message: str,
        callback: Callable[[str], Awaitable[None]] | None = None,
        background: bool = False,
    ):
        model = self.get_utility_model()

        # call extensions
        call_data = {
            "model": model,
            "system": system,
            "message": message,
            "callback": callback,
            "background": background,
        }
        await self.call_extensions("util_model_call_before", call_data=call_data)

        # propagate stream to callback if set
        async def stream_callback(chunk: str, total: str):
            if call_data["callback"]:
                await call_data["callback"](chunk)

        response, _reasoning = await call_data["model"].unified_call(
            system_message=call_data["system"],
            user_message=call_data["message"],
            response_callback=stream_callback if call_data["callback"] else None,
            rate_limiter_callback=(
                self.rate_limiter_callback if not call_data["background"] else None
            ),
        )

        return response

    async def call_chat_model(
        self,
        messages: list[BaseMessage],
        response_callback: Callable[[str, str], Awaitable[None]] | None = None,
        reasoning_callback: Callable[[str, str], Awaitable[None]] | None = None,
        background: bool = False,
    ):
        response = ""

        # model class
        model = self.get_chat_model()

        # call model
        response, reasoning = await model.unified_call(
            messages=messages,
            reasoning_callback=reasoning_callback,
            response_callback=response_callback,
            rate_limiter_callback=(
                self.rate_limiter_callback if not background else None
            ),
        )

        return response, reasoning

    async def rate_limiter_callback(
        self, message: str, key: str, total: int, limit: int
    ):
        # show the rate limit waiting in a progress bar, no need to spam the chat history
        self.context.log.set_progress(message, True)
        return False

    async def handle_intervention(self, progress: str = ""):
        while self.context.paused:
            await asyncio.sleep(0.1)  # wait if paused
        if (
            self.intervention
        ):  # if there is an intervention message, but not yet processed
            msg = self.intervention
            self.intervention = None  # reset the intervention message
            # If a tool was running, save its progress to history
            last_tool = self.loop_data.current_tool
            if last_tool:
                tool_progress = last_tool.progress.strip()
                if tool_progress:
                    self.hist_add_tool_result(last_tool.name, tool_progress)
                    last_tool.set_progress(None)
            if progress.strip():
                self.hist_add_ai_response(progress)
            # append the intervention message
            self.hist_add_user_message(msg, intervention=True)
            raise InterventionException(msg)

    async def wait_if_paused(self):
        while self.context.paused:
            await asyncio.sleep(0.1)

    async def process_tools(self, msg: str):
        # search for tool usage requests in agent message
        tool_request = extract_tools.json_parse_dirty(msg)

        if tool_request is not None:
            raw_tool_name = tool_request.get("tool_name", tool_request.get("tool",""))  # Get the raw tool name
            tool_args = tool_request.get("tool_args", tool_request.get("args", {}))

            tool_name = raw_tool_name  # Initialize tool_name with raw_tool_name
            tool_method = None  # Initialize tool_method

            # Split raw_tool_name into tool_name and tool_method if applicable
            if ":" in raw_tool_name:
                tool_name, tool_method = raw_tool_name.split(":", 1)

            tool = None  # Initialize tool to None

            # Try getting tool from MCP first
            try:
                import python.helpers.mcp_handler as mcp_helper

                mcp_tool_candidate = mcp_helper.MCPConfig.get_instance().get_tool(
                    self, tool_name
                )
                if mcp_tool_candidate:
                    tool = mcp_tool_candidate
            except ImportError:
                PrintStyle(
                    background_color="black", font_color="yellow", padding=True
                ).print("MCP helper module not found. Skipping MCP tool lookup.")
            except Exception as e:
                PrintStyle(
                    background_color="black", font_color="red", padding=True
                ).print(f"Failed to get MCP tool '{tool_name}': {e}")

            # Fallback to local get_tool if MCP tool was not found or MCP lookup failed
            if not tool:
                tool = self.get_tool(
                    name=tool_name,
                    method=tool_method,
                    args=tool_args,
                    message=msg,
                    loop_data=self.loop_data,
                )

            if tool:
                self.loop_data.current_tool = tool  # type: ignore
                try:
                    await self.handle_intervention()

                    # Call tool hooks for compatibility
                    await tool.before_execution(**tool_args)
                    await self.handle_intervention()

                    # Allow extensions to preprocess tool arguments
                    await self.call_extensions(
                        "tool_execute_before",
                        tool_args=tool_args or {},
                        tool_name=tool_name,
                    )

                    response = await tool.execute(**tool_args)
                    await self.handle_intervention()

                    # Allow extensions to postprocess tool response
                    await self.call_extensions(
                        "tool_execute_after", response=response, tool_name=tool_name
                    )

                    await tool.after_execution(response)
                    await self.handle_intervention()

                    if response.break_loop:
                        return response.message
                finally:
                    self.loop_data.current_tool = None
            else:
                error_detail = (
                    f"Tool '{raw_tool_name}' not found or could not be initialized."
                )
                self.hist_add_warning(error_detail)
                PrintStyle(font_color="red", padding=True).print(error_detail)
                self.context.log.log(
                    type="warning", content=f"{self.agent_name}: {error_detail}"
                )
        else:
            warning_msg_misformat = self.read_prompt("fw.msg_misformat.md")
            self.hist_add_warning(warning_msg_misformat)
            PrintStyle(font_color="red", padding=True).print(warning_msg_misformat)
            self.context.log.log(
                type="warning",
                content=f"{self.agent_name}: Message misformat, no valid tool request found.",
            )

    async def handle_reasoning_stream(self, stream: str):
        await self.handle_intervention()
        await self.call_extensions(
            "reasoning_stream",
            loop_data=self.loop_data,
            text=stream,
        )

    async def handle_response_stream(self, stream: str):
        await self.handle_intervention()
        try:
            if len(stream) < 25:
                return  # no reason to try
            response = DirtyJson.parse_string(stream)
            if isinstance(response, dict):
                await self.call_extensions(
                    "response_stream",
                    loop_data=self.loop_data,
                    text=stream,
                    parsed=response,
                )

        except Exception as e:
            pass

    def get_tool(
        self,
        name: str,
        method: str | None,
        args: dict,
        message: str,
        loop_data: LoopData | None,
        **kwargs,
    ):
        from python.tools.unknown import Unknown
        from python.helpers.tool import Tool

        classes = []

        # search for tools in agent's folder hierarchy
        paths = subagents.get_paths(self, "tools", name + ".py", default_root="python")
        for path in paths:
            try:
                classes = extract_tools.load_classes_from_file(path, Tool)  # type: ignore[arg-type]
                break
            except Exception:
                continue

        tool_class = classes[0] if classes else Unknown
        return tool_class(
            agent=self,
            name=name,
            method=method,
            args=args,
            message=message,
            loop_data=loop_data,
            **kwargs,
        )

    async def call_extensions(self, extension_point: str, **kwargs) -> Any:
        return await call_extensions(
            extension_point=extension_point, agent=self, **kwargs
        )

```

## FILE: models.py
```
from dataclasses import dataclass, field
from enum import Enum
import logging
import os
from typing import (
    Any,
    Awaitable,
    Callable,
    List,
    Optional,
    Iterator,
    AsyncIterator,
    Tuple,
    TypedDict,
)

from litellm import completion, acompletion, embedding
import litellm
import openai
from litellm.types.utils import ModelResponse

from python.helpers import dotenv
from python.helpers import settings, dirty_json
from python.helpers.dotenv import load_dotenv
from python.helpers.providers import ModelType as ProviderModelType, get_provider_config
from python.helpers.rate_limiter import RateLimiter
from python.helpers.tokens import approximate_tokens
from python.helpers import dirty_json, browser_use_monkeypatch

from langchain_core.language_models.chat_models import SimpleChatModel
from langchain_core.outputs.chat_generation import ChatGenerationChunk
from langchain_core.callbacks.manager import (
    CallbackManagerForLLMRun,
    AsyncCallbackManagerForLLMRun,
)
from langchain_core.messages import (
    BaseMessage,
    AIMessageChunk,
    HumanMessage,
    SystemMessage,
)
from langchain.embeddings.base import Embeddings
from sentence_transformers import SentenceTransformer
from pydantic import ConfigDict


# disable extra logging, must be done repeatedly, otherwise browser-use will turn it back on for some reason
def turn_off_logging():
    os.environ["LITELLM_LOG"] = "ERROR"  # only errors
    litellm.suppress_debug_info = True
    # Silence **all** LiteLLM sub-loggers (utils, cost_calculator…)
    for name in logging.Logger.manager.loggerDict:
        if name.lower().startswith("litellm"):
            logging.getLogger(name).setLevel(logging.ERROR)


# init
load_dotenv()
turn_off_logging()
browser_use_monkeypatch.apply()

litellm.modify_params = True # helps fix anthropic tool calls by browser-use

class ModelType(Enum):
    CHAT = "Chat"
    EMBEDDING = "Embedding"


@dataclass
class ModelConfig:
    type: ModelType
    provider: str
    name: str
    api_base: str = ""
    ctx_length: int = 0
    limit_requests: int = 0
    limit_input: int = 0
    limit_output: int = 0
    vision: bool = False
    kwargs: dict = field(default_factory=dict)

    def build_kwargs(self):
        kwargs = self.kwargs.copy() or {}
        if self.api_base and "api_base" not in kwargs:
            kwargs["api_base"] = self.api_base
        return kwargs


class ChatChunk(TypedDict):
    """Simplified response chunk for chat models."""
    response_delta: str
    reasoning_delta: str

class ChatGenerationResult:
    """Chat generation result object"""
    def __init__(self, chunk: ChatChunk|None = None):
        self.reasoning = ""
        self.response = ""
        self.thinking = False
        self.thinking_tag = ""
        self.unprocessed = ""
        self.native_reasoning = False
        self.thinking_pairs = [("<think>", "</think>"), ("<reasoning>", "</reasoning>")]
        if chunk:
            self.add_chunk(chunk)

    def add_chunk(self, chunk: ChatChunk) -> ChatChunk:
        if chunk["reasoning_delta"]:
            self.native_reasoning = True

        # if native reasoning detection works, there's no need to worry about thinking tags
        if self.native_reasoning:
            processed_chunk = ChatChunk(response_delta=chunk["response_delta"], reasoning_delta=chunk["reasoning_delta"])
        else:
            # if the model outputs thinking tags, we ned to parse them manually as reasoning
            processed_chunk = self._process_thinking_chunk(chunk)

        self.reasoning += processed_chunk.get("reasoning_delta", "")
        self.response += processed_chunk.get("response_delta", "")

        return processed_chunk

    def _process_thinking_chunk(self, chunk: ChatChunk) -> ChatChunk:
        response_delta = self.unprocessed + chunk["response_delta"]
        self.unprocessed = ""
        return self._process_thinking_tags(response_delta, chunk["reasoning_delta"])

    def _process_thinking_tags(self, response: str, reasoning: str) -> ChatChunk:
        if self.thinking:
            close_pos = response.find(self.thinking_tag)
            if close_pos != -1:
                reasoning += response[:close_pos]
                response = response[close_pos + len(self.thinking_tag):]
                self.thinking = False
                self.thinking_tag = ""
            else:
                if self._is_partial_closing_tag(response):
                    self.unprocessed = response
                    response = ""
                else:
                    reasoning += response
                    response = ""
        else:
            for opening_tag, closing_tag in self.thinking_pairs:
                if response.startswith(opening_tag):
                    response = response[len(opening_tag):]
                    self.thinking = True
                    self.thinking_tag = closing_tag

                    close_pos = response.find(closing_tag)
                    if close_pos != -1:
                        reasoning += response[:close_pos]
                        response = response[close_pos + len(closing_tag):]
                        self.thinking = False
                        self.thinking_tag = ""
                    else:
                        if self._is_partial_closing_tag(response):
                            self.unprocessed = response
                            response = ""
                        else:
                            reasoning += response
                            response = ""
                    break
                elif len(response) < len(opening_tag) and self._is_partial_opening_tag(response, opening_tag):
                    self.unprocessed = response
                    response = ""
                    break

        return ChatChunk(response_delta=response, reasoning_delta=reasoning)

    def _is_partial_opening_tag(self, text: str, opening_tag: str) -> bool:
        for i in range(1, len(opening_tag)):
            if text == opening_tag[:i]:
                return True
        return False

    def _is_partial_closing_tag(self, text: str) -> bool:
        if not self.thinking_tag or not text:
            return False
        max_check = min(len(text), len(self.thinking_tag) - 1)
        for i in range(1, max_check + 1):
            if text.endswith(self.thinking_tag[:i]):
                return True
        return False

    def output(self) -> ChatChunk:
        response = self.response
        reasoning = self.reasoning
        if self.unprocessed:
            if reasoning and not response:
                reasoning += self.unprocessed
            else:
                response += self.unprocessed
        return ChatChunk(response_delta=response, reasoning_delta=reasoning)


rate_limiters: dict[str, RateLimiter] = {}
api_keys_round_robin: dict[str, int] = {}


def get_api_key(service: str) -> str:
    # get api key for the service
    key = (
        dotenv.get_dotenv_value(f"API_KEY_{service.upper()}")
        or dotenv.get_dotenv_value(f"{service.upper()}_API_KEY")
        or dotenv.get_dotenv_value(f"{service.upper()}_API_TOKEN")
        or "None"
    )
    # if the key contains a comma, use round-robin
    if "," in key:
        api_keys = [k.strip() for k in key.split(",") if k.strip()]
        api_keys_round_robin[service] = api_keys_round_robin.get(service, -1) + 1
        key = api_keys[api_keys_round_robin[service] % len(api_keys)]
    return key


def get_rate_limiter(
    provider: str, name: str, requests: int, input: int, output: int
) -> RateLimiter:
    key = f"{provider}\\{name}"
    rate_limiters[key] = limiter = rate_limiters.get(key, RateLimiter(seconds=60))
    limiter.limits["requests"] = requests or 0
    limiter.limits["input"] = input or 0
    limiter.limits["output"] = output or 0
    return limiter


def _is_transient_litellm_error(exc: Exception) -> bool:
    """Uses status_code when available, else falls back to exception types"""
    # Prefer explicit status codes if present
    status_code = getattr(exc, "status_code", None)
    if isinstance(status_code, int):
        if status_code in (408, 429, 500, 502, 503, 504):
            return True
        # Treat other 5xx as retriable
        if status_code >= 500:
            return True
        return False

    # Fallback to exception classes mapped by LiteLLM/OpenAI
    transient_types = (
        getattr(openai, "APITimeoutError", Exception),
        getattr(openai, "APIConnectionError", Exception),
        getattr(openai, "RateLimitError", Exception),
        getattr(openai, "APIError", Exception),
        getattr(openai, "InternalServerError", Exception),
        # Some providers map overloads to ServiceUnavailable-like errors
        getattr(openai, "APIStatusError", Exception),
    )
    return isinstance(exc, transient_types)


async def apply_rate_limiter(
    model_config: ModelConfig | None,
    input_text: str,
    rate_limiter_callback: (
        Callable[[str, str, int, int], Awaitable[bool]] | None
    ) = None,
):
    if not model_config:
        return
    limiter = get_rate_limiter(
        model_config.provider,
        model_config.name,
        model_config.limit_requests,
        model_config.limit_input,
        model_config.limit_output,
    )
    limiter.add(input=approximate_tokens(input_text))
    limiter.add(requests=1)
    await limiter.wait(rate_limiter_callback)
    return limiter


def apply_rate_limiter_sync(
    model_config: ModelConfig | None,
    input_text: str,
    rate_limiter_callback: (
        Callable[[str, str, int, int], Awaitable[bool]] | None
    ) = None,
):
    if not model_config:
        return
    import asyncio, nest_asyncio

    nest_asyncio.apply()
    return asyncio.run(
        apply_rate_limiter(model_config, input_text, rate_limiter_callback)
    )


class LiteLLMChatWrapper(SimpleChatModel):
    model_name: str
    provider: str
    kwargs: dict = {}

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        extra="allow",
        validate_assignment=False,
    )

    def __init__(
        self,
        model: str,
        provider: str,
        model_config: Optional[ModelConfig] = None,
        **kwargs: Any,
    ):
        model_value = f"{provider}/{model}"
        super().__init__(model_name=model_value, provider=provider, kwargs=kwargs)  # type: ignore
        # Set A0 model config as instance attribute after parent init
        self.a0_model_conf = model_config

    @property
    def _llm_type(self) -> str:
        return "litellm-chat"

    def _convert_messages(self, messages: List[BaseMessage]) -> List[dict]:
        result = []
        # Map LangChain message types to LiteLLM roles
        role_mapping = {
            "human": "user",
            "ai": "assistant",
            "system": "system",
            "tool": "tool",
        }
        for m in messages:
            role = role_mapping.get(m.type, m.type)
            message_dict = {"role": role, "content": m.content}

            # Handle tool calls for AI messages
            tool_calls = getattr(m, "tool_calls", None)
            if tool_calls:
                # Convert LangChain tool calls to LiteLLM format
                new_tool_calls = []
                for tool_call in tool_calls:
                    # Ensure arguments is a JSON string
                    args = tool_call["args"]
                    if isinstance(args, dict):
                        import json

                        args_str = json.dumps(args)
                    else:
                        args_str = str(args)

                    new_tool_calls.append(
                        {
                            "id": tool_call.get("id", ""),
                            "type": "function",
                            "function": {
                                "name": tool_call["name"],
                                "arguments": args_str,
                            },
                        }
                    )
                message_dict["tool_calls"] = new_tool_calls

            # Handle tool call ID for ToolMessage
            tool_call_id = getattr(m, "tool_call_id", None)
            if tool_call_id:
                message_dict["tool_call_id"] = tool_call_id

            result.append(message_dict)
        return result

    def _call(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        import asyncio

        msgs = self._convert_messages(messages)

        # Apply rate limiting if configured
        apply_rate_limiter_sync(self.a0_model_conf, str(msgs))

        # Call the model
        resp = completion(
            model=self.model_name, messages=msgs, stop=stop, **{**self.kwargs, **kwargs}
        )

        # Parse output
        parsed = _parse_chunk(resp)
        output = ChatGenerationResult(parsed).output()
        return output["response_delta"]

    def _stream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[ChatGenerationChunk]:
        import asyncio

        msgs = self._convert_messages(messages)

        # Apply rate limiting if configured
        apply_rate_limiter_sync(self.a0_model_conf, str(msgs))

        result = ChatGenerationResult()

        for chunk in completion(
            model=self.model_name,
            messages=msgs,
            stream=True,
            stop=stop,
            **{**self.kwargs, **kwargs},
        ):
            # parse chunk
            parsed = _parse_chunk(chunk) # chunk parsing
            output = result.add_chunk(parsed) # chunk processing

            # Only yield chunks with non-None content
            if output["response_delta"]:
                yield ChatGenerationChunk(
                    message=AIMessageChunk(content=output["response_delta"])
                )

    async def _astream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> AsyncIterator[ChatGenerationChunk]:
        msgs = self._convert_messages(messages)

        # Apply rate limiting if configured
        await apply_rate_limiter(self.a0_model_conf, str(msgs))

        result = ChatGenerationResult()

        response = await acompletion(
            model=self.model_name,
            messages=msgs,
            stream=True,
            stop=stop,
            **{**self.kwargs, **kwargs},
        )
        async for chunk in response:  # type: ignore
            # parse chunk
            parsed = _parse_chunk(chunk) # chunk parsing
            output = result.add_chunk(parsed) # chunk processing

            # Only yield chunks with non-None content
            if output["response_delta"]:
                yield ChatGenerationChunk(
                    message=AIMessageChunk(content=output["response_delta"])
                )

    async def unified_call(
        self,
        system_message="",
        user_message="",
        messages: List[BaseMessage] | None = None,
        response_callback: Callable[[str, str], Awaitable[None]] | None = None,
        reasoning_callback: Callable[[str, str], Awaitable[None]] | None = None,
        tokens_callback: Callable[[str, int], Awaitable[None]] | None = None,
        rate_limiter_callback: (
            Callable[[str, str, int, int], Awaitable[bool]] | None
        ) = None,
        **kwargs: Any,
    ) -> Tuple[str, str]:

        turn_off_logging()

        if not messages:
            messages = []
        # construct messages
        if system_message:
            messages.insert(0, SystemMessage(content=system_message))
        if user_message:
            messages.append(HumanMessage(content=user_message))

        # convert to litellm format
        msgs_conv = self._convert_messages(messages)

        # Apply rate limiting if configured
        limiter = await apply_rate_limiter(
            self.a0_model_conf, str(msgs_conv), rate_limiter_callback
        )

        # Prepare call kwargs and retry config (strip A0-only params before calling LiteLLM)
        call_kwargs: dict[str, Any] = {**self.kwargs, **kwargs}
        max_retries: int = int(call_kwargs.pop("a0_retry_attempts", 2))
        retry_delay_s: float = float(call_kwargs.pop("a0_retry_delay_seconds", 1.5))
        stream = reasoning_callback is not None or response_callback is not None or tokens_callback is not None

        # results
        result = ChatGenerationResult()

        attempt = 0
        while True:
            got_any_chunk = False
            try:
                # call model
                _completion = await acompletion(
                    model=self.model_name,
                    messages=msgs_conv,
                    stream=stream,
                    **call_kwargs,
                )

                if stream:
                    # iterate over chunks
                    async for chunk in _completion:  # type: ignore
                        got_any_chunk = True
                        # parse chunk
                        parsed = _parse_chunk(chunk)
                        output = result.add_chunk(parsed)

                        # collect reasoning delta and call callbacks
                        if output["reasoning_delta"]:
                            if reasoning_callback:
                                await reasoning_callback(output["reasoning_delta"], result.reasoning)
                            if tokens_callback:
                                await tokens_callback(
                                    output["reasoning_delta"],
                                    approximate_tokens(output["reasoning_delta"]),
                                )
                            # Add output tokens to rate limiter if configured
                            if limiter:
                                limiter.add(output=approximate_tokens(output["reasoning_delta"]))
                        # collect response delta and call callbacks
                        if output["response_delta"]:
                            if response_callback:
                                await response_callback(output["response_delta"], result.response)
                            if tokens_callback:
                                await tokens_callback(
                                    output["response_delta"],
                                    approximate_tokens(output["response_delta"]),
                                )
                            # Add output tokens to rate limiter if configured
                            if limiter:
                                limiter.add(output=approximate_tokens(output["response_delta"]))

                # non-stream response
                else:
                    parsed = _parse_chunk(_completion)
                    output = result.add_chunk(parsed)
                    if limiter:
                        if output["response_delta"]:
                            limiter.add(output=approximate_tokens(output["response_delta"]))
                        if output["reasoning_delta"]:
                            limiter.add(output=approximate_tokens(output["reasoning_delta"]))

                # Successful completion of stream
                return result.response, result.reasoning

            except Exception as e:
                import asyncio

                # Retry only if no chunks received and error is transient
                if got_any_chunk or not _is_transient_litellm_error(e) or attempt >= max_retries:
                    raise
                attempt += 1
                await asyncio.sleep(retry_delay_s)


class AsyncAIChatReplacement:
    class _Completions:
        def __init__(self, wrapper):
            self._wrapper = wrapper

        async def create(self, *args, **kwargs):
            # call the async _acall method on the wrapper
            return await self._wrapper._acall(*args, **kwargs)

    class _Chat:
        def __init__(self, wrapper):
            self.completions = AsyncAIChatReplacement._Completions(wrapper)

    def __init__(self, wrapper, *args, **kwargs):
        self._wrapper = wrapper
        self.chat = AsyncAIChatReplacement._Chat(wrapper)


from browser_use.llm import ChatOllama, ChatOpenRouter, ChatGoogle, ChatAnthropic, ChatGroq, ChatOpenAI

class BrowserCompatibleChatWrapper(ChatOpenRouter):
    """
    A wrapper for browser agent that can filter/sanitize messages
    before sending them to the LLM.
    """

    def __init__(self, *args, **kwargs):
        turn_off_logging()
        # Create the underlying LiteLLM wrapper
        self._wrapper = LiteLLMChatWrapper(*args, **kwargs)
        # Browser-use may expect a 'model' attribute
        self.model = self._wrapper.model_name
        self.kwargs = self._wrapper.kwargs

    @property
    def model_name(self) -> str:
        return self._wrapper.model_name

    @property
    def provider(self) -> str:
        return self._wrapper.provider

    def get_client(self, *args, **kwargs):  # type: ignore
        return AsyncAIChatReplacement(self, *args, **kwargs)

    async def _acall(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ):
        # Apply rate limiting if configured
        apply_rate_limiter_sync(self._wrapper.a0_model_conf, str(messages))

        # Call the model
        try:
            model = kwargs.pop("model", None)
            kwrgs = {**self._wrapper.kwargs, **kwargs}

            # hack from browser-use to fix json schema for gemini (additionalProperties, $defs, $ref)
            if "response_format" in kwrgs and "json_schema" in kwrgs["response_format"] and model.startswith("gemini/"):
                kwrgs["response_format"]["json_schema"] = ChatGoogle("")._fix_gemini_schema(kwrgs["response_format"]["json_schema"])

            resp = await acompletion(
                model=self._wrapper.model_name,
                messages=messages,
                stop=stop,
                **kwrgs,
            )

            # Gemini: strip triple backticks and conform schema
            try:
                msg = resp.choices[0].message # type: ignore
                if self.provider == "gemini" and isinstance(getattr(msg, "content", None), str):
                    cleaned = browser_use_monkeypatch.gemini_clean_and_conform(msg.content) # type: ignore
                    if cleaned:
                        msg.content = cleaned
            except Exception:
                pass

        except Exception as e:
            raise e

        # another hack for browser-use post process invalid jsons
        try:
            if "response_format" in kwrgs and "json_schema" in kwrgs["response_format"] or "json_object" in kwrgs["response_format"]:
                if resp.choices[0].message.content is not None and not resp.choices[0].message.content.startswith("{"): # type: ignore
                    js = dirty_json.parse(resp.choices[0].message.content) # type: ignore
                    resp.choices[0].message.content = dirty_json.stringify(js) # type: ignore
        except Exception as e:
            pass

        return resp

class LiteLLMEmbeddingWrapper(Embeddings):
    model_name: str
    kwargs: dict = {}
    a0_model_conf: Optional[ModelConfig] = None

    def __init__(
        self,
        model: str,
        provider: str,
        model_config: Optional[ModelConfig] = None,
        **kwargs: Any,
    ):
        self.model_name = f"{provider}/{model}" if provider != "openai" else model
        self.kwargs = kwargs
        self.a0_model_conf = model_config

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # Apply rate limiting if configured
        apply_rate_limiter_sync(self.a0_model_conf, " ".join(texts))

        resp = embedding(model=self.model_name, input=texts, **self.kwargs)
        return [
            item.get("embedding") if isinstance(item, dict) else item.embedding  # type: ignore
            for item in resp.data  # type: ignore
        ]

    def embed_query(self, text: str) -> List[float]:
        # Apply rate limiting if configured
        apply_rate_limiter_sync(self.a0_model_conf, text)

        resp = embedding(model=self.model_name, input=[text], **self.kwargs)
        item = resp.data[0]  # type: ignore
        return item.get("embedding") if isinstance(item, dict) else item.embedding  # type: ignore


class LocalSentenceTransformerWrapper(Embeddings):
    """Local wrapper for sentence-transformers models to avoid HuggingFace API calls"""

    def __init__(
        self,
        provider: str,
        model: str,
        model_config: Optional[ModelConfig] = None,
        **kwargs: Any,
    ):
        # Clean common user-input mistakes
        model = model.strip().strip('"').strip("'")

        # Remove the "sentence-transformers/" prefix if present
        if model.startswith("sentence-transformers/"):
            model = model[len("sentence-transformers/") :]

        # Filter kwargs for SentenceTransformer only (no LiteLLM params like 'stream_timeout')
        st_allowed_keys = {
            "device",
            "cache_folder",
            "use_auth_token",
            "revision",
            "trust_remote_code",
            "model_kwargs",
        }
        st_kwargs = {k: v for k, v in (kwargs or {}).items() if k in st_allowed_keys}

        self.model = SentenceTransformer(model, **st_kwargs)
        self.model_name = model
        self.a0_model_conf = model_config

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # Apply rate limiting if configured
        apply_rate_limiter_sync(self.a0_model_conf, " ".join(texts))

        embeddings = self.model.encode(texts, convert_to_tensor=False)  # type: ignore
        return embeddings.tolist() if hasattr(embeddings, "tolist") else embeddings  # type: ignore

    def embed_query(self, text: str) -> List[float]:
        # Apply rate limiting if configured
        apply_rate_limiter_sync(self.a0_model_conf, text)

        embedding = self.model.encode([text], convert_to_tensor=False)  # type: ignore
        result = (
            embedding[0].tolist() if hasattr(embedding[0], "tolist") else embedding[0]
        )
        return result  # type: ignore


def _get_litellm_chat(
    cls: type = LiteLLMChatWrapper,
    model_name: str = "",
    provider_name: str = "",
    model_config: Optional[ModelConfig] = None,
    **kwargs: Any,
):
    # use api key from kwargs or env
    api_key = kwargs.pop("api_key", None) or get_api_key(provider_name)

    # Only pass API key if key is not a placeholder
    if api_key and api_key not in ("None", "NA"):
        kwargs["api_key"] = api_key

    provider_name, model_name, kwargs = _adjust_call_args(
        provider_name, model_name, kwargs
    )
    return cls(
        provider=provider_name, model=model_name, model_config=model_config, **kwargs
    )


def _get_litellm_embedding(
    model_name: str,
    provider_name: str,
    model_config: Optional[ModelConfig] = None,
    **kwargs: Any,
):
    # Check if this is a local sentence-transformers model
    if provider_name == "huggingface" and model_name.startswith(
        "sentence-transformers/"
    ):
        # Use local sentence-transformers instead of LiteLLM for local models
        provider_name, model_name, kwargs = _adjust_call_args(
            provider_name, model_name, kwargs
        )
        return LocalSentenceTransformerWrapper(
            provider=provider_name,
            model=model_name,
            model_config=model_config,
            **kwargs,
        )

    # use api key from kwargs or env
    api_key = kwargs.pop("api_key", None) or get_api_key(provider_name)

    # Only pass API key if key is not a placeholder
    if api_key and api_key not in ("None", "NA"):
        kwargs["api_key"] = api_key

    provider_name, model_name, kwargs = _adjust_call_args(
        provider_name, model_name, kwargs
    )
    return LiteLLMEmbeddingWrapper(
        model=model_name, provider=provider_name, model_config=model_config, **kwargs
    )


def _parse_chunk(chunk: Any) -> ChatChunk:
    delta = chunk["choices"][0].get("delta", {})
    message = chunk["choices"][0].get("message", {}) or chunk["choices"][0].get(
        "model_extra", {}
    ).get("message", {})
    response_delta = (
        delta.get("content", "")
        if isinstance(delta, dict)
        else getattr(delta, "content", "")
    ) or (
        message.get("content", "")
        if isinstance(message, dict)
        else getattr(message, "content", "")
    ) or ""
    reasoning_delta = (
        delta.get("reasoning_content", "")
        if isinstance(delta, dict)
        else getattr(delta, "reasoning_content", "")
    ) or (
        message.get("reasoning_content", "")
        if isinstance(message, dict)
        else getattr(message, "reasoning_content", "")
    ) or ""

    return ChatChunk(reasoning_delta=reasoning_delta, response_delta=response_delta)



def _adjust_call_args(provider_name: str, model_name: str, kwargs: dict):
    # for openrouter add app reference
    if provider_name == "openrouter":
        kwargs["extra_headers"] = {
            "HTTP-Referer": "https://agent-zero.ai",
            "X-Title": "Agent Zero",
        }

    # remap other to openai for litellm
    if provider_name == "other":
        provider_name = "openai"

    return provider_name, model_name, kwargs


def _merge_provider_defaults(
    provider_type: ProviderModelType, original_provider: str, kwargs: dict
) -> tuple[str, dict]:
    # Normalize .env-style numeric strings (e.g., "timeout=30") into ints/floats for LiteLLM
    def _normalize_values(values: dict) -> dict:
        result: dict[str, Any] = {}
        for k, v in values.items():
            if isinstance(v, str):
                try:
                    result[k] = int(v)
                except ValueError:
                    try:
                        result[k] = float(v)
                    except ValueError:
                        result[k] = v
            else:
                result[k] = v
        return result

    provider_name = original_provider  # default: unchanged
    cfg = get_provider_config(provider_type, original_provider)
    if cfg:
        provider_name = cfg.get("litellm_provider", original_provider).lower()

        # Extra arguments nested under `kwargs` for readability
        extra_kwargs = cfg.get("kwargs") if isinstance(cfg, dict) else None  # type: ignore[arg-type]
        if isinstance(extra_kwargs, dict):
            for k, v in extra_kwargs.items():
                kwargs.setdefault(k, v)

    # Inject API key based on the *original* provider id if still missing
    if "api_key" not in kwargs:
        key = get_api_key(original_provider)
        if key and key not in ("None", "NA"):
            kwargs["api_key"] = key

    # Merge LiteLLM global kwargs (timeouts, stream_timeout, etc.)
    try:
        global_kwargs = settings.get_settings().get("litellm_global_kwargs", {})  # type: ignore[union-attr]
    except Exception:
        global_kwargs = {}
    if isinstance(global_kwargs, dict):
        for k, v in _normalize_values(global_kwargs).items():
            kwargs.setdefault(k, v)

    return provider_name, kwargs


def get_chat_model(
    provider: str, name: str, model_config: Optional[ModelConfig] = None, **kwargs: Any
) -> LiteLLMChatWrapper:
    orig = provider.lower()
    provider_name, kwargs = _merge_provider_defaults("chat", orig, kwargs)
    return _get_litellm_chat(
        LiteLLMChatWrapper, name, provider_name, model_config, **kwargs
    )


def get_browser_model(
    provider: str, name: str, model_config: Optional[ModelConfig] = None, **kwargs: Any
) -> BrowserCompatibleChatWrapper:
    orig = provider.lower()
    provider_name, kwargs = _merge_provider_defaults("chat", orig, kwargs)
    return _get_litellm_chat(
        BrowserCompatibleChatWrapper, name, provider_name, model_config, **kwargs
    )


def get_embedding_model(
    provider: str, name: str, model_config: Optional[ModelConfig] = None, **kwargs: Any
) -> LiteLLMEmbeddingWrapper | LocalSentenceTransformerWrapper:
    orig = provider.lower()
    provider_name, kwargs = _merge_provider_defaults("embedding", orig, kwargs)
    return _get_litellm_embedding(name, provider_name, model_config, **kwargs)

```

## FILE: requirements.txt
```
a2wsgi==1.10.8
ansio==0.0.1
browser-use==0.5.11
docker==7.1.0
duckduckgo-search==6.1.12
faiss-cpu==1.11.0
fastmcp==2.13.1
fasta2a==0.5.0
flask[async]==3.0.3
flask-basicauth==0.2.0
flaredantic==0.1.5
GitPython==3.1.43
inputimeout==1.0.4
kokoro>=0.9.2
simpleeval==1.0.3
langchain-core==0.3.49
langchain-community==0.3.19
langchain-unstructured[all-docs]==0.1.6
openai-whisper==20250625
lxml_html_clean==0.3.1
markdown==3.7
mcp==1.22.0
newspaper3k==0.2.8
paramiko==3.5.0
playwright==1.52.0
pypdf==6.0.0
python-dotenv==1.1.0
pytz==2024.2
sentence-transformers==3.0.1
tiktoken==0.8.0
unstructured[all-docs]==0.16.23
unstructured-client==0.31.0
webcolors==24.6.0
nest-asyncio==1.6.0
crontab==1.0.1
markdownify==1.1.0
pydantic==2.11.7
pymupdf==1.25.3
pytesseract==0.3.13
pdf2image==1.17.0
crontab==1.0.1
pathspec>=0.12.1
psutil>=7.0.0
soundfile==0.13.1
imapclient>=3.0.1
html2text>=2024.2.26
beautifulsoup4>=4.12.3
boto3>=1.35.0
exchangelib>=5.4.3
pywinpty==3.0.2; sys_platform == "win32"
python-socketio>=5.14.2
uvicorn>=0.38.0
wsproto>=1.2.0

```

## FILE: prompts/agent.system.main.md
```
# Agent Zero System Manual

{{ include "agent.system.main.role.md" }}

{{ include "agent.system.main.environment.md" }}

{{ include "agent.system.main.communication.md" }}

{{ include "agent.system.main.solving.md" }}

{{ include "agent.system.main.tips.md" }}

```

## FILE: conf/model_providers.yaml
```
# Supported model providers for Agent Zero
# ---------------------------------------
#
# Each provider type ("chat", "embedding") contains a mapping of provider IDs
# to their configurations.
#
# The provider ID (e.g., "anthropic") is used:
#  - in the settings UI dropdowns.
#  - to construct the environment variable for the API key (e.g., ANTHROPIC_API_KEY).
#
# Each provider configuration requires:
#   name:             Human-readable name for the UI.
#   litellm_provider: The corresponding provider name in LiteLLM.
#
# Optional fields:
#   kwargs:           A dictionary of extra parameters to pass to LiteLLM.
#                     This is useful for `api_base`, `extra_headers`, etc.

chat:
  a0_venice:
    name: Agent Zero API
    litellm_provider: openai
    kwargs:
      api_base: https://llm.agent-zero.ai/v1
      venice_parameters:
        include_venice_system_prompt: false
  anthropic:
    name: Anthropic
    litellm_provider: anthropic
  cometapi:
    name: CometAPI
    litellm_provider: cometapi
  deepseek:
    name: DeepSeek
    litellm_provider: deepseek
  github_copilot:
    name: GitHub Copilot
    litellm_provider: github_copilot
    kwargs:
      extra_headers:
        "Editor-Version": "vscode/1.85.1"
        "Copilot-Integration-Id": "vscode-chat"
        "Copilot-Vision-Request": "true"
  google:
    name: Google
    litellm_provider: gemini
  groq:
    name: Groq
    litellm_provider: groq
  huggingface:
    name: HuggingFace
    litellm_provider: huggingface
  lm_studio:
    name: LM Studio
    litellm_provider: lm_studio
  mistral:
    name: Mistral AI
    litellm_provider: mistral
  moonshot:
    name: Moonshot AI
    litellm_provider: moonshot
  ollama:
    name: Ollama
    litellm_provider: ollama
  openai:
    name: OpenAI
    litellm_provider: openai
  azure:
    name: OpenAI Azure
    litellm_provider: azure
  bedrock:
    name: AWS Bedrock
    litellm_provider: bedrock
  openrouter:
    name: OpenRouter
    litellm_provider: openrouter
    kwargs:
      extra_headers:
        "HTTP-Referer": "https://agent-zero.ai/"
        "X-Title": "Agent Zero"
  sambanova:
    name: Sambanova
    litellm_provider: sambanova
  venice:
    name: Venice.ai
    litellm_provider: openai
    kwargs:
      api_base: https://api.venice.ai/api/v1
      venice_parameters:
        include_venice_system_prompt: false
  xai:
    name: xAI
    litellm_provider: xai
  zai:
    name: Z.AI
    litellm_provider: openai
    kwargs:
      api_base: https://api.z.ai/api/paas/v4
  zai_coding:
    name: Z.AI Coding
    litellm_provider: openai
    kwargs:
      api_base: https://api.z.ai/api/coding/paas/v4
  other:
    name: Other OpenAI compatible
    litellm_provider: openai

embedding:
  huggingface:
    name: HuggingFace
    litellm_provider: huggingface
  google:
    name: Google
    litellm_provider: gemini
  lm_studio:
    name: LM Studio
    litellm_provider: lm_studio
  mistral:
    name: Mistral AI
    litellm_provider: mistral
  ollama:
    name: Ollama
    litellm_provider: ollama
  openai:
    name: OpenAI
    litellm_provider: openai
  azure:
    name: OpenAI Azure
    litellm_provider: azure
  bedrock:
    name: AWS Bedrock
    litellm_provider: bedrock
  # TODO: OpenRouter not yet supported by LiteLLM, replace with native litellm_provider openrouter and remove api_base when ready
  openrouter:
    name: OpenRouter
    litellm_provider: openai
    kwargs:
      api_base: https://openrouter.ai/api/v1
      extra_headers:
        "HTTP-Referer": "https://agent-zero.ai/"
        "X-Title": "Agent Zero"
  other:
    name: Other OpenAI compatible
    litellm_provider: openai

```

## FILE: agents/agent0/agent.json
```
{
  "title": "Agent 0",
  "description": "Main agent of the system communicating directly with the user.",
  "context": ""
}

```

## FILE: docker/run/Dockerfile
```
# Use the pre-built base image for A0
# FROM agent-zero-base:local
# FROM agent0ai/agent-zero-base:testing
FROM agent0ai/agent-zero-base:latest

# Check if the argument is provided, else throw an error
ARG BRANCH
RUN if [ -z "$BRANCH" ]; then echo "ERROR: BRANCH is not set!" >&2; exit 1; fi
ENV BRANCH=$BRANCH

# Copy filesystem files to root
COPY ./fs/ /

# pre installation steps
RUN bash /ins/pre_install.sh $BRANCH

# install A0
RUN bash /ins/install_A0.sh $BRANCH

# install additional software
RUN bash /ins/install_additional.sh $BRANCH

# cleanup repo and install A0 without caching, this speeds up builds
ARG CACHE_DATE=none
RUN echo "cache buster $CACHE_DATE" && bash /ins/install_A02.sh $BRANCH

# post installation steps
RUN bash /ins/post_install.sh $BRANCH

# Expose ports
EXPOSE 22 80 9000-9009

RUN chmod +x /exe/initialize.sh /exe/run_A0.sh /exe/run_searxng.sh /exe/run_tunnel_api.sh

# initialize runtime and switch to supervisord
CMD ["/exe/initialize.sh", "$BRANCH"]

```
