'use client';
import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import './2048.css';

const SIZE = 4;

const getEmptyBoard = () => Array(SIZE).fill(0).map(() => Array(SIZE).fill(0));
const getRandomInt = (max: number) => Math.floor(Math.random() * max);
const cloneBoard = (board: number[][]) => board.map(row => [...row]);
const addRandomTile = (board: number[][]) => {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (board[r][c] === 0) empty.push([r,c]);
  if (!empty.length) return board;
  const [r,c] = empty[getRandomInt(empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
  return board;
};

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>(getEmptyBoard());
  const [score, setScore] = useState(0);
  const [topScore, setTopScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{name:string,score:number}[]>([]);

  useEffect(() => {
    setBoard(addRandomTile(getEmptyBoard()));
    const saved = localStorage.getItem('topScore');
    if (saved) setTopScore(parseInt(saved));
    fetchLeaderboard();
  }, []);

  useEffect(() => localStorage.setItem('topScore', topScore.toString()), [topScore]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboard(data);
    } catch { setLeaderboard([]); }
  };

  const handleMove = (dir: string) => {
    let newBoard = cloneBoard(board);
    let moved = false;

    const moveRowLeft = (row: number[]) => {
      let newRow = row.filter(v=>v!==0);
      for(let i=0;i<newRow.length-1;i++){
        if(newRow[i]===newRow[i+1]){
          newRow[i]*=2;
          setScore(prev=>{const upd = prev+newRow[i]; if(upd>topScore) setTopScore(upd); return upd;});
          newRow[i+1]=0;
        }
      }
      newRow=newRow.filter(v=>v!==0);
      while(newRow.length<SIZE) newRow.push(0);
      return newRow;
    };

    if(dir==='left') newBoard=newBoard.map(moveRowLeft);
    if(dir==='right') newBoard=newBoard.map(r=>moveRowLeft(r.reverse()).reverse());
    if(dir==='up') for(let c=0;c<SIZE;c++){const col=moveRowLeft(newBoard.map(r=>r[c])); for(let r=0;r<SIZE;r++) newBoard[r][c]=col[r];}
    if(dir==='down') for(let c=0;c<SIZE;c++){const col=moveRowLeft(newBoard.map(r=>r[c]).reverse()).reverse(); for(let r=0;r<SIZE;r++) newBoard[r][c]=col[r];}

    if(JSON.stringify(newBoard)!==JSON.stringify(board)) moved=true;
    if(moved) setBoard(addRandomTile(newBoard));
  };

  useEffect(()=>{
    const handleKey=(e:KeyboardEvent)=>{
      if(e.key==='ArrowUp') handleMove('up');
      if(e.key==='ArrowDown') handleMove('down');
      if(e.key==='ArrowLeft') handleMove('left');
      if(e.key==='ArrowRight') handleMove('right');
    };
    window.addEventListener('keydown',handleKey);
    return ()=>window.removeEventListener('keydown',handleKey);
  },[board]);

  const handlers = useSwipeable({
    onSwipedLeft:()=>handleMove('left'),
    onSwipedRight:()=>handleMove('right'),
    onSwipedUp:()=>handleMove('up'),
    onSwipedDown:()=>handleMove('down'),
  });

  const restartGame=()=>{ setBoard(addRandomTile(getEmptyBoard())); setScore(0); };
  const submitScore=async()=>{
    const name = prompt('Enter your name for leaderboard');
    if(!name) return;
    await fetch('/api/leaderboard',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name,score}),
    });
    fetchLeaderboard();
  };

  return (
    <div {...handlers} className="game-container">
      <h1>2048</h1>
      <h2>Score: {score}</h2>
      <h3>Top Score: {topScore}</h3>

      <div style={{display:'flex',gap:'10px',marginTop:'10px'}}>
        <button onClick={restartGame}>Restart Game</button>
        <button onClick={submitScore}>Submit Score</button>
      </div>

      <div className="board" style={{marginTop:'20px'}}>
        {board.map((row,i)=>row.map((cell,j)=>(
          <div key={`${i}-${j}`} className={`cell cell-${cell}`}>{cell!==0?cell:''}</div>
        )))}
      </div>

      <div className="leaderboard">
        <h2>Leaderboard</h2>
        <ol>
          {leaderboard.map((p,i)=><li key={i}>{p.name}: {p.score}</li>)}
        </ol>
      </div>
    </div>
  );
}
