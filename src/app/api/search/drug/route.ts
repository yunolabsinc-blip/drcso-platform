import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.DATA_GO_KR_API_KEY!;
const BASE_URL = "http://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemName = searchParams.get("name") || "";
  const entpName = searchParams.get("company") || "";
  const page = searchParams.get("page") || "1";
  const size = searchParams.get("size") || "20";

  const params = new URLSearchParams({
    serviceKey: API_KEY,
    pageNo: page,
    numOfRows: size,
    type: "json",
  });

  if (itemName) params.set("itemName", itemName);
  if (entpName) params.set("entpName", entpName);

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    const data = await res.json();

    const body = data?.body;
    const items = body?.items;

    const drugs = Array.isArray(items) ? items : items ? [items] : [];

    return NextResponse.json({
      total: body?.totalCount ?? 0,
      page: Number(page),
      items: drugs.map((d: Record<string, string>) => ({
        itemName: d.itemName ?? "",
        entpName: d.entpName ?? "",
        itemSeq: d.itemSeq ?? "",
        efcyQesitm: stripHtml(d.efcyQesitm ?? ""),
        useMethodQesitm: stripHtml(d.useMethodQesitm ?? ""),
        atpnQesitm: stripHtml(d.atpnQesitm ?? ""),
        seQesitm: stripHtml(d.seQesitm ?? ""),
        depositMethodQesitm: stripHtml(d.depositMethodQesitm ?? ""),
        itemImage: d.itemImage ?? null,
      })),
    });
  } catch (err) {
    console.error("Drug API error:", err);
    return NextResponse.json({ error: "의약품 정보 조회에 실패했습니다." }, { status: 500 });
  }
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}
