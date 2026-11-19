"""
Grounded Prompt Builder & Custom System Prompt Chain ([Q1], [Q5], [Q6+]).
Builds deterministic prompts for 2-Pass Pre-RAG Gemma 4 inference:
  - Pass 1 ([Q1]): Query normalization & intent clarification with Query Drift Guard
  - Pass 2 ([Q5]): RAG-grounded answer synthesis with [MM:SS] citations & custom preset/format
  - Extra Stages ([Q6+]): Pluggable post-processing Gemma 4 stages
"""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

PromptProfile = Literal["qa_refine", "cornell_notes", "quiz_json", "custom"]
ResponseFormat = Literal["text", "json"]

DEFAULT_QUERY_PREP_SYSTEM_PROMPT = (
    "Bạn là Trợ lý Chuẩn hóa Câu hỏi Học thuật Cáo Kitsune của LectureLens (Pass 1 — Pre-RAG Query Normalizer).\n"
    "Nhiệm vụ: Nhận câu hỏi gốc của sinh viên trước khi truy xuất Kho RAG, sau đó làm rõ và chuẩn hóa thành một câu truy vấn sạch phục vụ tìm kiếm.\n"
    "QUY TẮC BẮT BUỘC (CHỐNG TRÔI TỪ KHÓA / QUERY DRIFT):\n"
    "1. Khôi phục đầy đủ dấu tiếng Việt và sửa lỗi chính tả nếu người dùng nhập không dấu hoặc gõ nhầm.\n"
    "2. BẢO TOÀN 100% mọi thuật ngữ tiếng Anh, từ viết tắt, mã môn/chương/số hiệu và tên riêng có trong câu hỏi gốc "
    "(ví dụ: TCP/IP, AGDLP, GPO, BGE-M3, Gradient Descent, CS301); tuyệt đối không tự ý dịch mất, thay thế hay lược bỏ chúng.\n"
    "3. Làm rõ ý định tìm kiếm học thuật nhưng KHÔNG tự trả lời câu hỏi và KHÔNG bịa thêm kiến thức ngoài câu hỏi gốc.\n"
    "4. Chỉ xuất ra DUY NHẤT 1 câu truy vấn đã chuẩn hóa, ngắn gọn và sẵn sàng đưa vào công cụ tìm kiếm (không thêm lời chào, tiền tố hay giải thích)."
)

DEFAULT_RAG_ANSWER_SYSTEM_PROMPTS: dict[str, str] = {
    "qa_refine": (
        "Bạn là Trợ lý Học thuật Cáo Kitsune của LectureLens (Pass 2 — Gemma 4 + RAG).\n"
        "Nhiệm vụ: Tổng hợp câu trả lời học thuật chính xác bằng tiếng Việt DỰA TRÊN "
        "câu hỏi của sinh viên và duy nhất phần [NGỮ CẢNH BÀI GIẢNG].\n"
        "QUY TẮC BẮT BUỘC:\n"
        "1. Chỉ sử dụng thông tin có trong [NGỮ CẢNH BÀI GIẢNG], tuyệt đối không suy diễn hoặc bịa kiến thức bên ngoài.\n"
        "2. Sửa lỗi chính tả, lỗi nhận dạng giọng nói (ASR) hoặc thuật ngữ chuyên ngành dựa trên ngữ cảnh.\n"
        "3. Mọi luận điểm, định nghĩa hoặc ví dụ PHẢI gắn kèm mốc thời gian trích dẫn dạng [MM:SS].\n"
        "4. Nếu ngữ cảnh không chứa thông tin để trả lời, trả lời đúng một câu: "
        "\"Bài giảng không đề cập đến nội dung này.\""
    ),
    "cornell_notes": (
        "Bạn là Trợ lý Ghi Chép Cornell Notes của LectureLens (Pass 2 — Gemma 4 + RAG).\n"
        "Hãy chuyển hóa thông tin trong [NGỮ CẢNH BÀI GIẢNG] thành ghi chú chuẩn Cornell Notes bằng tiếng Việt:\n"
        "## Summary\n(Tóm tắt cô đọng 2-3 câu)\n\n"
        "## Cues\n- (Các từ khóa / câu hỏi gợi nhớ trọng tâm)\n\n"
        "## Notes\n- (Các luận điểm chi tiết kèm mốc thời gian [MM:SS])\n\n"
        "Tuyệt đối không bịa thêm thông tin ngoài ngữ cảnh bài giảng; nếu không có dữ kiện phù hợp, "
        "ghi rõ: \"Bài giảng không đề cập đến nội dung này.\""
    ),
    "quiz_json": (
        "Bạn là Trình tạo câu hỏi ôn tập LectureLens (Pass 2 — Gemma 4 + RAG Strict JSON Output).\n"
        "Dựa duy nhất trên [NGỮ CẢNH BÀI GIẢNG], hãy xuất ra DUY NHẤT một đối tượng JSON hợp lệ "
        "(không bọc markdown ```json) theo đúng schema:\n"
        "{\n"
        '  "questions": [\n'
        "    {\n"
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
        "label": "Hỏi đáp học thuật (QA + RAG)",
        "default_response_format": "text",
        "description": "Tổng hợp câu trả lời tiếng Việt mạch lạc trực tiếp từ RAG, sửa lỗi ASR và gắn citation [MM:SS].",
        "system_prompt": DEFAULT_RAG_ANSWER_SYSTEM_PROMPTS["qa_refine"],
    },
    {
        "id": "cornell_notes",
        "label": "Ghi chú Cornell Notes",
        "default_response_format": "text",
        "description": "Định dạng kiến thức RAG thành 3 phần Summary, Cues và Notes kèm mốc thời gian [MM:SS].",
        "system_prompt": DEFAULT_RAG_ANSWER_SYSTEM_PROMPTS["cornell_notes"],
    },
    {
        "id": "quiz_json",
        "label": "Bộ câu hỏi trắc nghiệm (JSON)",
        "default_response_format": "json",
        "description": "Sinh JSON câu hỏi ôn tập từ ngữ cảnh RAG có đáp án, giải thích và timestamp [MM:SS].",
        "system_prompt": DEFAULT_RAG_ANSWER_SYSTEM_PROMPTS["quiz_json"],
    },
    {
        "id": "custom",
        "label": "Tùy biến System Prompt riêng",
        "default_response_format": "text",
        "description": "Dùng trực tiếp System Prompt tùy chỉnh do bạn nhập cho Pass 2 ([Q5] Gemma 4 + RAG).",
        "system_prompt": DEFAULT_RAG_ANSWER_SYSTEM_PROMPTS["qa_refine"],
    },
]


class LLMStageConfig(BaseModel):
    """Configuration for a pluggable Gemma 4 extra stage ([Q6+])."""

    model_config = ConfigDict(populate_by_name=True)

    stage_id: str = Field(..., alias="stageId", min_length=1, max_length=64)
    system_prompt: str = Field(..., alias="systemPrompt", min_length=1)
    response_format: ResponseFormat = Field(default="text", alias="responseFormat")
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    max_new_tokens: int = Field(default=512, alias="maxNewTokens", ge=1, le=4096)
    enabled: bool = Field(default=True)


class BuiltPrompt(BaseModel):
    """Fully rendered prompt ready for Gemma 4 generation."""

    stage_id: str
    profile: str
    system_prompt: str
    user_prompt: str
    formatted_context: str = ""
    response_format: ResponseFormat = "text"


class GroundedPromptBuilder:
    """
    Deep module that resolves 2-Pass Pre-RAG system prompts ([Q1] Query Prep -> [Q5] RAG Answer -> [Q6+] Extra)
    and formats [MM:SS] RAG contexts cleanly.
    """

    @staticmethod
    def resolve_query_prep_system_prompt(custom_system_prompt: str | None = None) -> str:
        if custom_system_prompt and custom_system_prompt.strip():
            return custom_system_prompt.strip()
        return DEFAULT_QUERY_PREP_SYSTEM_PROMPT

    @staticmethod
    def resolve_answer_system_prompt(
        custom_system_prompt: str | None = None,
        profile: PromptProfile = "qa_refine",
    ) -> str:
        if custom_system_prompt and custom_system_prompt.strip():
            return custom_system_prompt.strip()
        return DEFAULT_RAG_ANSWER_SYSTEM_PROMPTS.get(
            profile,
            DEFAULT_RAG_ANSWER_SYSTEM_PROMPTS["qa_refine"],
        )

    @staticmethod
    def resolve_answer_response_format(
        profile: PromptProfile = "qa_refine",
        response_format: ResponseFormat | None = None,
    ) -> ResponseFormat:
        if response_format is not None:
            return response_format
        if profile == "quiz_json":
            return "json"
        return "text"

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

    def build_query_prep_prompt(
        self,
        *,
        query: str,
        custom_system_prompt: str | None = None,
    ) -> BuiltPrompt:
        system_prompt = self.resolve_query_prep_system_prompt(custom_system_prompt)
        user_prompt = (
            "[CÂU HỎI GỐC CỦA SINH VIÊN]\n"
            f"{query.strip()}\n\n"
            "[CÂU TRUY VẤN ĐÃ CHUẨN HÓA]"
        )
        return BuiltPrompt(
            stage_id="q1_query_prep",
            profile="query_prep",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            formatted_context="",
            response_format="text",
        )

    def build_rag_answer_prompt(
        self,
        *,
        query: str,
        prepared_query: str,
        contexts: list[dict],
        custom_system_prompt: str | None = None,
        profile: PromptProfile = "qa_refine",
        response_format: ResponseFormat | None = None,
        use_expanded_context: bool = True,
    ) -> BuiltPrompt:
        system_prompt = self.resolve_answer_system_prompt(custom_system_prompt, profile)
        resolved_format = self.resolve_answer_response_format(profile, response_format)
        formatted_context = self.format_contexts(contexts, use_expanded_context=use_expanded_context)

        format_rule = (
            "Chỉ trả về JSON hợp lệ theo đúng cấu trúc yêu cầu, không thêm giải thích ngoài JSON."
            if resolved_format == "json"
            else "Trả về văn bản hoàn chỉnh bám sát ngữ cảnh bài giảng và giữ chính xác các mốc trích dẫn [MM:SS]."
        )
        normalized_prep = (prepared_query or "").strip() or query.strip()
        user_prompt = (
            "[CÂU HỎI GỐC CỦA SINH VIÊN]\n"
            f"{query.strip()}\n\n"
            "[CÂU HỎI ĐÃ CHUẨN HÓA (PASS 1)]\n"
            f"{normalized_prep}\n\n"
            "[NGỮ CẢNH BÀI GIẢNG]\n"
            f"{formatted_context}\n\n"
            "[YÊU CẦU ĐỊNH DẠNG ĐẦU RA]\n"
            f"{format_rule}"
        )
        return BuiltPrompt(
            stage_id="q5_rag_answer",
            profile=profile,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            formatted_context=formatted_context,
            response_format=resolved_format,
        )

    def build_custom_stage_prompt(
        self,
        *,
        stage: LLMStageConfig,
        previous_output: str,
        query: str,
        contexts: list[dict],
        use_expanded_context: bool = True,
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
        )

    @staticmethod
    def get_presets() -> dict:
        return {
            "default_query_system_prompt": DEFAULT_QUERY_PREP_SYSTEM_PROMPT,
            "presets": PRESET_METADATA,
        }
