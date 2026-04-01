import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.DATA_GO_KR_API_KEY!;
const BASE_URL = "https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "";
  const page = searchParams.get("page") || "1";
  const size = searchParams.get("size") || "20";
  const sidoCd = searchParams.get("sidoCd") || "";
  const dgsbjtCd = searchParams.get("dgsbjtCd") || "";

  const params = new URLSearchParams({
    pageNo: page,
    numOfRows: size,
    _type: "json",
  });

  if (name) params.set("yadmNm", name);
  if (sidoCd) params.set("sidoCd", sidoCd);
  if (dgsbjtCd) params.set("dgsbjtCd", dgsbjtCd);

  try {
    const res = await fetch(`${BASE_URL}?serviceKey=${encodeURIComponent(API_KEY)}&${params.toString()}`);
    const data = await res.json();

    const body = data?.response?.body;
    const items = body?.items?.item;

    const hospitals = Array.isArray(items)
      ? items
      : items
        ? [items]
        : [];

    return NextResponse.json({
      total: body?.totalCount ?? 0,
      page: Number(page),
      items: hospitals.map((h: Record<string, string>) => ({
        name: h.yadmNm ?? "",
        address: h.addr ?? "",
        phone: h.telno ?? "",
        type: h.clCdNm ?? "",
        department: h.dgsbjtCdNm ?? "",
        doctorCount: h.drTotCnt ?? "0",
        ykiho: h.ykiho ?? "",
        xPos: h.XPos ?? "",
        yPos: h.YPos ?? "",
      })),
    });
  } catch (err) {
    console.error("Hospital API error:", err);
    return NextResponse.json({ error: "병원 정보 조회에 실패했습니다." }, { status: 500 });
  }
}
