"""
Grounded Prompt Builder & Custom System Prompt Chain ([Q5], [Q6], [Q7+]).
Builds deterministic prompts for Multi-Pass Gemma 4 inference and computes
SHA-256 `prompt_hash` values so [Q1] Semantic Query Cache never serves stale formats.
"""
import hashlib
import json
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

PromptProfile = Literal["qa_refine", "cornell_notes", "quiz_json", "custom"]
ResponseFormat = Literal["text", "json"]

DEFAULT_RAG_DRAFT_SYSTEM_PROMPT = (
    "Bạn là Trợ lý Học thuật Cáo Kitsune của LectureLens (Pass 1 — Grounded Extraction).\n"
    "Nhiệm vụ: Tổng hợp câu trả lời nháp trung thực nhất cho câu hỏi của sinh viên DỰA TRÊN "
    "duy nhất phần [NGỮ CẢNH BÀI GIẢNG].\n"
    "QUY TẮC BẮT BUỘC:\n"
    "1. Chỉ sử dụng thông tin có trong [NGỮ CẢNH BÀI GIẢNG], tuyệt đối không suy diễn hoặc bịa kiến thức bên ngoài.\n"
    "2. Mọi luận điểm, định nghĩa hoặc ví dụ PHẢI gắn kèm mốc thời gian trích dẫn dạng [MM:SS].\n"
    "3. Nếu ngữ cảnh không chứa thông tin để trả lời, trả lời đúng một câu: "
    "\"Bài giảng không đề cập đến nội dung này.\""
)

DEFAULT_REFINER_SYSTEM_PROMPTS: dict[str, str] = {
    "qa_refine": (
        "Bạn là Biên tập viên Học thuật LectureLens (Pass 2 — Polish & Grounded Verification).\n"
        "Nhiệm vụ: Nhận câu hỏi gốc, bản nháp Pass 1 và ngữ cảnh bài giảng, sau đó biên tập lại câu trả lời cuối cùng.\n"
        "QUY TẮC BẮT BUỘC:\n"
        "1. Sửa lỗi chính tả, lỗi nhận dạng giọng nói (ASR) hoặc thuật ngữ công nghệ/học thuật chưa chuẩn dựa vào ngữ cảnh.\n"
        "2. Giữ văn phong tiếng Việt học thuật tự nhiên, mạch lạc, rõ ý.\n"
        "3. Bảo toàn đầy đủ và chính xác mọi mốc thời gian trích dẫn [MM:SS] từ bản nháp và ngữ cảnh.\n"
        "4. Không thêm thông tin không có trong bài giảng."
    ),
    "cornell_notes": (
        "Bạn là Trợ lý Ghi Chép Cornell Notes của LectureLens (Pass 2).\n"
        "Hãy chuyển hóa bản nháp Pass 1 và ngữ cảnh bài giảng thành ghi chú chuẩn Cornell Notes bằng tiếng Việt:\n"
        "## Summary\n(Tóm tắt cô đọng 2-3 câu)\n\n"
        "## Cues\n- (Các từ khóa / câu hỏi gợi nhớ trọng tâm)\n\n"
        "## Notes\n- (Các luận điểm chi tiết kèm mốc thời gian [MM:SS])\n\n"
        "Tuyệt đối không bịa thêm thông tin ngoài ngữ cảnh bài giảng."
    ),
    "quiz_json": (
        "Bạn là Trình tạo câu hỏi ôn tập LectureLens (Pass 2 — Strict JSON Output).\n"
        "Dựa trên bản nháp Pass 1 và ngữ cảnh bài giảng, hãy xuất ra DUY NHẤT một đối tượng JSON hợp lệ "
        "(không bọc markdown ```json) theo đúng schema:\n"
        "{\n"
        '  "questions": [\n'
        '    {\n'
        '      "question": "Câu hỏi ôn tập tiếng Việt",\n'
        '      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],\n'
        '      "answer": "A. ...",\n'
        '      "timestamp": "[MM:SS]",\n'
        '      "explanation": "Giải thích ngắn gọn dựa trên bài giảng [MM:SS]"\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Chỉ dùng dữ kiện có trong bài giảng và giữ đúng mốc [MM:SS]."
    ),
}

PRESET_METADATA: list[dict[str, str]] = [
    {
        "id": "qa_refine",
        "label": "Hỏi đáp học thuật (QA Refine)",
        "default_response_format": "text",
        "description": "Biên tập câu chữ tiếng Việt mượt mà, sửa lỗi chính tả ASR và giữ nguyên citation [MM:SS].",
        "system_prompt": DEFAULT_REFINER_SYSTEM_PROMPTS["qa_refine"],
    },
    {
        "id": "cornell_notes",
        "label": "Ghi chú Cornell Notes",
        "default_response_format": "text",
        "description": "Định dạng thành 3 phần Summary, Cues và Notes kèm mốc thời gian [MM:SS].",
        "system_prompt": DEFAULT_REFINER_SYSTEM_PROMPTS["cornell_notes"],
    },
    {
        "id": "quiz_json",
        "label": "Bộ câu hỏi trắc nghiệm (JSON)",
        "default_response_format": "json",
        "description": "Sinh JSON câu hỏi ôn tập có đáp án, giải thích và timestamp [MM:SS].",
        "system_prompt": DEFAULT_REFINER_SYSTEM_PROMPTS["quiz_json"],
    },
    {
        "id": "custom",
        "label": "Tùy biến System Prompt riêng",
        "default_response_format": "text",
        "description": "Dùng trực tiếp System Prompt tùy chỉnh do bạn nhập cho Pass 2 ([Q6]).",
        "system_prompt": DEFAULT_REFINER_SYSTEM_PROMPTS["qa_refine"],
    },
]


class LLMStageConfig(BaseModel):
    """Configuration for a pluggable Gemma 4 stage ([Q7+] or custom pipeline step)."""

    model_config = ConfigDict(populate_by_name=True)

    stage_id: str = Field(..., alias="stageId", min_length=1, max_length=64)
    system_prompt: str = Field(..., alias="systemPrompt", min_length=1)
    response_format: ResponseFormat = Field(default="text", alias="responseFormat")
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    max_new_tokens: int = Field(default=512, alias="maxNewTokens", ge=1, le=4096)
    enabled: bool = Field(default=True)


class BuiltPrompt(BaseModel):
    """Fully rendered prompt ready for Gemma 4 E4B generation."""

    stage_id: str
    profile: str
    system_prompt: str
    user_prompt: str
    formatted_context: str
    response_format: ResponseFormat = "text"
    prompt_hash: str = ""


class GroundedPromptBuilder:
    """
    Deep module that resolves multi-pass system prompts ([Q5] Draft -> [Q6] Custom Refiner -> [Q7+] Extra),
    formats [MM:SS] RAG contexts cleanly, and hashes the active prompt chain for [Q1] Semantic Cache.
    """

    @staticmethod
    def resolve_draft_system_prompt(custom_system_prompt: str | None = None) -> str:
        if custom_system_prompt and custom_system_prompt.strip():
            return custom_system_prompt.strip()
        return DEFAULT_RAG_DRAFT_SYSTEM_PROMPT

    @staticmethod
    def resolve_refiner_system_prompt(
        custom_refiner_system_prompt: str | None = None,
        profile: PromptProfile = "qa_refine",
    ) -> str:
        if custom_refiner_system_prompt and custom_refiner_system_prompt.strip():
            return custom_refiner_system_prompt.strip()
        return DEFAULT_REFINER_SYSTEM_PROMPTS.get(
            profile,
            DEFAULT_REFINER_SYSTEM_PROMPTS["qa_refine"],
        )

    @staticmethod
    def resolve_refiner_response_format(
        profile: PromptProfile = "qa_refine",
        response_format: ResponseFormat | None = None,
    ) -> ResponseFormat:
        if response_format is not None:
            return response_format
        if profile == "quiz_json":
            return "json"
        return "text"

    @classmethod
    def compute_pipeline_prompt_hash(
        cls,
        *,
        draft_system_prompt: str | None = None,
        refiner_system_prompt: str | None = None,
        profile: PromptProfile = "qa_refine",
        response_format: ResponseFormat | None = None,
        use_expanded_context: bool = True,
        extra_stages: list[LLMStageConfig] | None = None,
    ) -> str:
        """
        Computes a deterministic SHA-256 fingerprint across all enabled LLM stages ([Q5], [Q6], [Q7+]).
        Any edit to System Prompts, profile, or output format produces a distinct cache partition.
        """
        resolved_draft = cls.resolve_draft_system_prompt(draft_system_prompt)
        resolved_refiner = cls.resolve_refiner_system_prompt(refiner_system_prompt, profile)
        resolved_format = cls.resolve_refiner_response_format(profile, response_format)
        active_extra = [
            {
                "stage_id": stage.stage_id,
                "system_prompt": stage.system_prompt.strip(),
                "response_format": stage.response_format,
                "temperature": round(float(stage.temperature), 4),
                "max_new_tokens": int(stage.max_new_tokens),
            }
            for stage in (extra_stages or [])
            if stage.enabled
        ]

        canonical = {
            "version": 1,
            "q5_draft_system_prompt": resolved_draft,
            "q6_profile": profile,
            "q6_refiner_system_prompt": resolved_refiner,
            "q6_response_format": resolved_format,
            "use_expanded_context": bool(use_expanded_context),
            "extra_stages": active_extra,
        }
        payload = json.dumps(canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def format_contexts(
        contexts: list[dict],
        use_expanded_context: bool = True,
    ) -> str:
        if not contexts:
            return "(Không có đoạn ngữ cảnh nào được trích xuất từ bài giảng.)"

        blocks: list[str] = []
        for idx, ctx in enumerate(contexts, start=1):
            start_ts = ctx.get("start_timestamp_display") or ctx.get("startTime") or "00:00"
            end_ts = ctx.get("end_timestamp_display") or ctx.get("endTime") or start_ts
            score = ctx.get("rerank_score")
            score_label = f" | Rerank: {float(score):.3f}" if score is not None else ""
            header = f"- Đoạn {idx} ([{start_ts} - {end_ts}]{score_label}):"

            expanded = ctx.get("expanded_context") or []
            if use_expanded_context and expanded:
                lines = [header]
                for item in expanded:
                    pos = item.get("position", "CURRENT")
                    item_start = item.get("start_timestamp_display", start_ts)
                    item_end = item.get("end_timestamp_display", end_ts)
                    item_text = str(item.get("content", "")).strip()
                    if item_text:
                        lines.append(f"  [{pos} {item_start}-{item_end}] {item_text}")
                blocks.append("\n".join(lines))
            else:
                text = str(ctx.get("content") or ctx.get("text_snippet") or "").strip()
                blocks.append(f"{header}\n  [{start_ts}-{end_ts}] {text}")

        return "\n\n".join(blocks)

    def build_rag_draft_prompt(
        self,
        *,
        query: str,
        contexts: list[dict],
        custom_system_prompt: str | None = None,
        use_expanded_context: bool = True,
        prompt_hash: str = "",
    ) -> BuiltPrompt:
        system_prompt = self.resolve_draft_system_prompt(custom_system_prompt)
        formatted_context = self.format_contexts(contexts, use_expanded_context=use_expanded_context)
        user_prompt = (
            "[NGỮ CẢNH BÀI GIẢNG]\n"
            f"{formatted_context}\n\n"
            "[CÂU HỎI CỦA SINH VIÊN]\n"
            f"{query.strip()}\n\n"
            "[BẢN NHÁP TRÍCH XUẤT CÓ DẪN NGUỒN [MM:SS]]"
        )
        return BuiltPrompt(
            stage_id="q5_rag_draft",
            profile="rag_draft",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            formatted_context=formatted_context,
            response_format="text",
            prompt_hash=prompt_hash,
        )

    def build_refinement_prompt(
        self,
        *,
        query: str,
        draft_answer: str,
        contexts: list[dict],
        custom_refiner_system_prompt: str | None = None,
        profile: PromptProfile = "qa_refine",
        response_format: ResponseFormat | None = None,
        use_expanded_context: bool = True,
        prompt_hash: str = "",
    ) -> BuiltPrompt:
        system_prompt = self.resolve_refiner_system_prompt(custom_refiner_system_prompt, profile)
        resolved_format = self.resolve_refiner_response_format(profile, response_format)
        formatted_context = self.format_contexts(contexts, use_expanded_context=use_expanded_context)

        format_rule = (
            "Chỉ trả về JSON hợp lệ theo đúng cấu trúc yêu cầu, không thêm giải thích ngoài JSON."
            if resolved_format == "json"
            else "Trả về văn bản hoàn chỉnh, giữ chính xác các mốc trích dẫn [MM:SS]."
        )
        user_prompt = (
            "[CÂU HỎI GỐC CỦA SINH VIÊN]\n"
            f"{query.strip()}\n\n"
            "[BẢN NHÁP TỪ PASS 1 (CẦN BIÊN TẬP & CHUẨN HÓA)]\n"
            f"{draft_answer.strip()}\n\n"
            "[NGỮ CẢNH BÀI GIẢNG ĐỂ ĐỐI CHIẾU THUẬT NGỮ & MỐC THỜI GIAN]\n"
            f"{formatted_context}\n\n"
            "[YÊU CẦU ĐỊNH DẠNG ĐẦU RA]\n"
            f"{format_rule}"
        )
        return BuiltPrompt(
            stage_id="q6_custom_refine",
            profile=profile,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            formatted_context=formatted_context,
            response_format=resolved_format,
            prompt_hash=prompt_hash,
        )

    def build_custom_stage_prompt(
        self,
        *,
        stage: LLMStageConfig,
        previous_output: str,
        query: str,
        contexts: list[dict],
        use_expanded_context: bool = True,
        prompt_hash: str = "",
    ) -> BuiltPrompt:
        formatted_context = self.format_contexts(contexts, use_expanded_context=use_expanded_context)
        format_rule = (
            "Đầu ra bắt buộc là JSON hợp lệ."
            if stage.response_format == "json"
            else "Đầu ra là văn bản rõ ràng, giữ nguyên citation [MM:SS] nếu liên quan."
        )
        user_prompt = (
            "[CÂU HỎI GỐC CỦA SINH VIÊN]\n"
            f"{query.strip()}\n\n"
            "[ĐẦU RA TỪ BƯỚC TRƯỚC]\n"
            f"{previous_output.strip()}\n\n"
            "[NGỮ CẢNH BÀI GIẢNG THAM CHIẾU]\n"
            f"{formatted_context}\n\n"
            "[ĐỊNH DẠNG MONG MUỐN]\n"
            f"{format_rule}"
        )
        return BuiltPrompt(
            stage_id=stage.stage_id,
            profile="extra_stage",
            system_prompt=stage.system_prompt.strip(),
            user_prompt=user_prompt,
            formatted_context=formatted_context,
            response_format=stage.response_format,
            prompt_hash=prompt_hash,
        )

    @staticmethod
    def get_presets() -> dict:
        return {
            "default_draft_system_prompt": DEFAULT_RAG_DRAFT_SYSTEM_PROMPT,
            "presets": PRESET_METADATA,
        }
