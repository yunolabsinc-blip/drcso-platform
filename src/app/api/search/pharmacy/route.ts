import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.DATA_GO_KR_API_KEY!;
const BASE_URL = "https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "";
  const page = searchParams.get("page") || "1";
  const size = searchParams.get("size") || "20";
  const sido = searchParams.get("sido") || "";
  const sigungu = searchParams.get("sigungu") || "";

  const params = new URLSearchParams({
    pageNo: page,
    numOfRows: size,
  });

  if (name) params.set("QN", name);
  if (sido) params.set("Q0", sido);
  if (sigungu) params.set("Q1", sigungu);

  try {
    const res = await fetch(`${BASE_URL}?serviceKey=${encodeURIComponent(API_KEY)}&${params.toString()}`);
    const text = await res.text();

    // XML 파싱 (이 API는 XML만 지원)
    const items = parsePharmacyXml(text);

    // totalCount 추출
    const totalMatch = text.match(/<totalCount>(\d+)<\/totalCount>/);
    const total = totalMatch ? parseInt(totalMatch[1]) : items.length;

    return NextResponse.json({
      total,
      page: Number(page),
      items,
    });
  } catch (err) {
    console.error("Pharmacy API error:", err);
    return NextResponse.json({ error: "약국 정보 조회에 실패했습니다." }, { status: 500 });
  }
}

function parsePharmacyXml(xml: string) {
  const items: Array<Record<string, string>> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const getValue = (tag: string) => {
      const m = itemXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m ? m[1].trim() : "";
    };

    items.push({
      name: getValue("dutyName"),
      address: getValue("dutyAddr"),
      phone: getValue("dutyTel1"),
      mondayOpen: getValue("dutyTime1s"),
      mondayClose: getValue("dutyTime1c"),
      saturdayOpen: getValue("dutyTime6s"),
      saturdayClose: getValue("dutyTime6c"),
      sundayOpen: getValue("dutyTime7s"),
      sundayClose: getValue("dutyTime7c"),
      holidayOpen: getValue("dutyTime8s"),
      holidayClose: getValue("dutyTime8c"),
      xPos: getValue("wgs84Lon"),
      yPos: getValue("wgs84Lat"),
    });
  }

  return items;
}
