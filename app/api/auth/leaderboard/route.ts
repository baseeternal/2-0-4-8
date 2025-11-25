import { NextResponse } from 'next/server';

let scores: {name:string, score:number}[] = [];

export async function GET() {
  // Return top 10 scores descending
  const topScores = [...scores].sort((a,b)=>b.score-a.score).slice(0,10);
  return NextResponse.json(topScores);
}

export async function POST(req: Request) {
  const { name, score } = await req.json();
  if(!name || !score) return NextResponse.json({error:'Invalid'}, {status:400});
  scores.push({name, score});
  return NextResponse.json({success:true});
}
