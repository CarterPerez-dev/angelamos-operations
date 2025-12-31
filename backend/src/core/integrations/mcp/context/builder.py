"""
ⒸAngelaMos | 2025
builder.py
"""

from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from core.enums import PlatformType, WorkflowStage


class PromptBuilder:
    """
    Builds prompts by rendering Jinja2 templates with loaded context

    Templates are stored in core/integrations/mcp/prompts/templates/
    """
    def __init__(self):
        template_dir = Path(
            __file__
        ).parent.parent / "prompts" / "templates"
        self.env = Environment(
            loader = FileSystemLoader(template_dir),
            autoescape = select_autoescape(disabled_extensions = ("j2",
                                                                  )),
            trim_blocks = True,
            lstrip_blocks = True,
        )

    def build_prompt(
        self,
        platform: PlatformType,
        stage: WorkflowStage,
        context: dict[str,
                      Any],
        user_input: dict[str,
                         Any],
    ) -> str:
        """
        Build complete prompt for a workflow stage

        Args:
            platform: Platform (tiktok, reddit, etc.)
            stage: Workflow stage (ideas, hooks, hook_analysis, etc.)
            context: Loaded context from ContextLoader
            user_input: User's input for this stage

        Returns:
            Fully assembled prompt string ready for AI
        """
        template_name = f"{platform.value}_{stage.value}.j2"

        try:
            template = self.env.get_template(template_name)
        except Exception as e:
            raise ValueError(
                f"Template not found: {template_name}. Error: {e}"
            ) from e

        template_vars = {
            **context.get("static",
                          {}),
            **context.get("dynamic",
                          {}),
            **context.get("workflow",
                          {}),
            **user_input,
        }

        return template.render(**template_vars)

    def render_template(self, template_name: str, **kwargs: Any) -> str:
        """
        Render a specific template with variables
        """
        template = self.env.get_template(template_name)
        return template.render(**kwargs)
