import express from "express";
import * as yup from "yup";

const app = express();

type LaprasProfile = {
  e_score: number;
  b_score: number;
  i_score: number;
};
type ScoreType = "e" | "i" | "b";

const fetchLaprasData = async (userId: string): Promise<LaprasProfile> => {
  const url = `https://lapras.com/public/${userId}.json`;
  const res = await fetch(url);
  return (await res.json()) as LaprasProfile;
};

const fetchBadgeSvg = async (
  label: string,
  score: number,
  scoreColor: string
): Promise<string> => {
  const fixedScore = score.toFixed(2);
  const url = `https://img.shields.io/badge/${label}-${fixedScore}-${scoreColor}?style=for-the-badge`;
  const res = await fetch(url);
  return await res.text();
};

app.get("/badge", async (req, res) => {
  const querySchema = yup.object({
    userId: yup.string().required(),
    scoreType: yup.string().oneOf(["e", "b", "i"]).required(),
  });
  try {
    const { userId, scoreType } = querySchema.cast(req.query);
    const laprasData = await fetchLaprasData(userId);
    const [label, score] = (
      {
        e: ["LAPRAS_E--SCORE", laprasData.e_score],
        b: ["LAPRAS_B--SCORE", laprasData.b_score],
        i: ["LAPRAS_I--SCORE", laprasData.i_score],
      } as Record<ScoreType, [string, number]>
    )[scoreType];
    const scoreColor = score >= 3.5 ? "d50b0b" : "003089";
    const svg = await fetchBadgeSvg(label, score, scoreColor);
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "max-age=604800");
    res.send(svg);
  } catch (e) {
    res.status(400).json({ message: e.message });
    return;
  }
});

export default app;
