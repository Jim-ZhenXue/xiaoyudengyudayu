import React, { useState, useRef, TouchEvent } from 'react';
import { Citrus as Orange, Apple, Cherry } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  weight: number;
  icon: React.ReactNode;
}

function App() {
  const [leftItem, setLeftItem] = useState<Item | null>(null);
  const [rightItem, setRightItem] = useState<Item | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 });

  // 根据实际水果的平均重量（以克为单位）
  const items: Item[] = [
    { id: '1', name: '苹果', weight: 180, icon: <Apple className="w-12 h-12 text-red-500" /> },
    { id: '2', name: '橙子', weight: 150, icon: <Orange className="w-12 h-12 text-orange-500" /> },
    { id: '3', name: '樱桃', weight: 8, icon: <Cherry className="w-12 h-12 text-red-600" /> }
  ];

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDrop = (side: 'left' | 'right') => (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    const item = items.find(i => i.id === itemId);
    
    if (item) {
      if (side === 'left') {
        setLeftItem(item);
      } else {
        setRightItem(item);
      }
      setUserAnswer('');
      setFeedback('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTouchStart = (e: TouchEvent, item: Item) => {
    e.preventDefault();
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setTouchOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    setDraggedItem(item);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    const touch = e.touches[0];
    const dragElement = document.getElementById('dragged-item');
    if (dragElement) {
      dragElement.style.left = `${touch.clientX - touchOffset.x}px`;
      dragElement.style.top = `${touch.clientY - touchOffset.y}px`;
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    if (!draggedItem) return;

    const touch = e.changedTouches[0];
    const leftDropZone = document.getElementById('left-drop-zone');
    const rightDropZone = document.getElementById('right-drop-zone');

    if (leftDropZone && rightDropZone) {
      const leftRect = leftDropZone.getBoundingClientRect();
      const rightRect = rightDropZone.getBoundingClientRect();

      if (touch.clientX >= leftRect.left && touch.clientX <= leftRect.right &&
          touch.clientY >= leftRect.top && touch.clientY <= leftRect.bottom) {
        setLeftItem(draggedItem);
      } else if (touch.clientX >= rightRect.left && touch.clientX <= rightRect.right &&
                 touch.clientY >= rightRect.top && touch.clientY <= rightRect.bottom) {
        setRightItem(draggedItem);
      }
    }

    setDraggedItem(null);
  };

  const checkAnswer = (symbol: string) => {
    if (!leftItem || !rightItem) {
      setFeedback('请在天平两边各放置一个水果！');
      return;
    }

    let correct = false;
    if (symbol === '<' && leftItem.weight < rightItem.weight) correct = true;
    if (symbol === '>' && leftItem.weight > rightItem.weight) correct = true;
    if (symbol === '=' && leftItem.weight === rightItem.weight) correct = true;

    setUserAnswer(symbol);
    if (correct) {
      setScore(score + 1);
      setFeedback('回答正确！🎉');
    } else {
      setFeedback('再试一次！🤔');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <style>{`
        body {
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
          touch-action: none;
        }
        #dragged-item {
          position: fixed;
          pointer-events: none;
          z-index: 1000;
          transform: translate(-50%, -50%);
        }
      `}</style>
      
      {draggedItem && (
        <div id="dragged-item">
          {draggedItem.icon}
        </div>
      )}
      
      <div className="max-w-6xl mx-auto flex gap-8">
        {/* 左侧栏 - 标题和规则 */}
        <div className="w-1/4">
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-blue-800 mb-4">比一比重量</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">游戏规则：</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>将水果拖放到左右两端</li>
              <li>点击正确的符号（&lt;, =, 或 &gt;）来比较它们的重量</li>
              <li>答对得分！</li>
            </ol>
          </div>
          
          <div className="bg-white rounded-lg shadow-xl p-6">
          <h1 className="text-3xl font-bold text-blue-800 mb-4">得分：{score}</h1>
          </div>


          
        </div>


        {/* 右侧栏 - 游戏主体内容 */}
        <div className="w-3/4">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex justify-around items-center mb-8">
              <div 
                id="left-drop-zone"
                className="w-32 h-32 border-4 border-dashed border-blue-300 rounded-lg flex items-center justify-center bg-blue-50"
                onDrop={handleDrop('left')}
                onDragOver={handleDragOver}
              >
                {leftItem ? leftItem.icon : <p className="text-blue-400">拖放到这里</p>}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => checkAnswer('<')}
                  className={`px-6 py-3 rounded-lg text-2xl font-bold ${userAnswer === '<' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  &lt;
                </button>
                <button 
                  onClick={() => checkAnswer('=')}
                  className={`px-6 py-3 rounded-lg text-2xl font-bold ${userAnswer === '=' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  =
                </button>
                <button 
                  onClick={() => checkAnswer('>')}
                  className={`px-6 py-3 rounded-lg text-2xl font-bold ${userAnswer === '>' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  &gt;
                </button>
              </div>

              <div 
                id="right-drop-zone"
                className="w-32 h-32 border-4 border-dashed border-blue-300 rounded-lg flex items-center justify-center bg-blue-50"
                onDrop={handleDrop('right')}
                onDragOver={handleDragOver}
              >
                {rightItem ? rightItem.icon : <p className="text-blue-400">拖放到这里</p>}
              </div>
            </div>

            {feedback && (
              <p className="text-center text-xl font-semibold mb-8" style={{ color: feedback.includes('正确') ? '#22c55e' : '#ef4444' }}>
                {feedback}
              </p>
            )}

            <div className="flex justify-center gap-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onTouchStart={(e) => handleTouchStart(e, item)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="cursor-move hover:scale-110 transition-transform"
                >
                  {item.icon}
                  <p className="text-center mt-2 text-gray-600">{item.name}</p>
                  <p className="text-center text-sm text-gray-400">{item.weight}克</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;