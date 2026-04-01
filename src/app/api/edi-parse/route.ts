import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { image, mimeType } = await req.json();
    if (!image) {
      return NextResponse.json(
        { error: "이미지가 필요합니다." },
        { status: 400 }
      );
    }

    // 등록된 제품 목록 조회 (매칭용)
    const { data: products } = await supabase
      .from("products")
      .select("id, name, generic_name, base_price, commission_rate, commission_amount");

    const productList = (products ?? [])
      .map((p) => `- ${p.name} (성분: ${p.generic_name || "N/A"})`)
      .join("\n");

    const systemPrompt = `당신은 한국 제약 EDI(전자문서교환) 서류를 분석하는 전문가입니다.
사진에서 아래 정보를 정확히 추출해주세요. 반드시 JSON만 반환하세요.

등록된 제품 목록:
${productList}

반환 형식 (JSON 배열):
[{
  "hospital_name": "병원명 또는 약국명",
  "product_name": "제품명 (위 목록에서 가장 가까운 이름으로 매칭)",
  "generic_name": "성분명 (보이면 추출)",
  "quantity": 숫자,
  "amount": 숫자(원 단위, 총 처방금액)
}]

규칙:
- 여러 행이 보이면 배열로 모두 추출
- 숫자에 쉼표가 있으면 제거하고 정수로
- 금액을 찾을 수 없으면 0
- 수량을 찾을 수 없으면 1
- 병원명을 찾을 수 없으면 "미확인"
- 제품명은 등록된 목록과 최대한 매칭 (유사한 이름/성분이면 등록된 이름 사용)
- 백틱, 마크다운, 설명 텍스트 없이 순수 JSON 배열만 반환`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType || "image/jpeg",
                  data: image,
                },
              },
              {
                type: "text",
                text: "이 EDI 서류에서 병원명, 제품명, 수량, 금액을 추출해주세요.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      const errMsg =
        errData?.error?.message || `API 오류 (${response.status})`;
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    const data = await response.json();
    let text =
      data.content
        ?.map((c: { text?: string }) => c.text || "")
        .join("") || "";

    // JSON 추출
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");

    let parsed;
    if (start !== -1 && end > start) {
      parsed = JSON.parse(text.slice(start, end + 1));
    } else {
      // 단일 객체 시도
      const objStart = text.indexOf("{");
      const objEnd = text.lastIndexOf("}");
      if (objStart !== -1 && objEnd > objStart) {
        parsed = [JSON.parse(text.slice(objStart, objEnd + 1))];
      } else {
        return NextResponse.json(
          { error: "EDI 서류를 인식할 수 없습니다. 다시 촬영해주세요." },
          { status: 422 }
        );
      }
    }

    // 제품 매칭 + 수수료 계산
    const results = parsed.map(
      (item: {
        hospital_name?: string;
        product_name?: string;
        generic_name?: string;
        quantity?: number;
        amount?: number;
      }) => {
        const matched = (products ?? []).find(
          (p) =>
            p.name === item.product_name ||
            p.name.includes(item.product_name || "") ||
            (item.product_name || "").includes(p.name) ||
            (item.generic_name &&
              p.generic_name &&
              p.generic_name.includes(item.generic_name))
        );

        const amount = item.amount || 0;
        const commissionRate = matched?.commission_rate || 0;
        const commission = Math.round((amount * commissionRate) / 100);

        return {
          hospital_name: item.hospital_name || "미확인",
          product_name: matched?.name || item.product_name || "미확인",
          product_id: matched?.id || null,
          generic_name: item.generic_name || null,
          quantity: item.quantity || 1,
          amount,
          commission_rate: commissionRate,
          commission,
          matched: !!matched,
        };
      }
    );

    return NextResponse.json({ items: results });
  } catch (e) {
    console.error("EDI parse error:", e);
    return NextResponse.json(
      { error: "서류 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
