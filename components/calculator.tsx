import { useState } from 'react';
import { ChevronRightIcon, ChevronLeftIcon } from './icons';

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [newNumber, setNewNumber] = useState(true);
  const [isScientific, setIsScientific] = useState(false);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setNewNumber(true);
    setExpression(display + ' ' + op + ' ');
  };

  const handleScientific = (func: string) => {
    let toAppend = func;
    // Add parenthesis for functions
    if (['sin', 'cos', 'tan', 'log', 'ln', '√'].includes(func)) {
      toAppend = func + '(';
    }

    if (newNumber) {
      setDisplay(toAppend);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? toAppend : display + toAppend);
    }
  };

  const handleEqual = () => {
    try {
      let expr = (expression + display)
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/log/g, 'Math.log10')
        .replace(/ln/g, 'Math.log')
        .replace(/√/g, 'Math.sqrt')
        .replace(/\^/g, '**');

      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + expr)();
      
      const formattedResult = String(Math.round(result * 100000000) / 100000000);
      setDisplay(formattedResult);
      setExpression('');
      setNewNumber(true);
    } catch (e) {
      setDisplay('Error');
      setExpression('');
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setNewNumber(true);
  };

  const handlePercent = () => {
    const current = parseFloat(display);
    setDisplay(String(current / 100));
  };

  const handleSign = () => {
    if (newNumber) {
      setDisplay('-0');
      setNewNumber(false);
      return;
    }
    if (display.startsWith('-')) {
      setDisplay(display.slice(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const standardButtons = [
    { label: 'C', action: handleClear, type: 'secondary' },
    { label: '±', action: handleSign, type: 'secondary' },
    { label: '%', action: handlePercent, type: 'secondary' },
    { label: '÷', action: () => handleOperator('/'), type: 'operator' },
    { label: '7', action: () => handleNumber('7'), type: 'number' },
    { label: '8', action: () => handleNumber('8'), type: 'number' },
    { label: '9', action: () => handleNumber('9'), type: 'number' },
    { label: '×', action: () => handleOperator('*'), type: 'operator' },
    { label: '4', action: () => handleNumber('4'), type: 'number' },
    { label: '5', action: () => handleNumber('5'), type: 'number' },
    { label: '6', action: () => handleNumber('6'), type: 'number' },
    { label: '-', action: () => handleOperator('-'), type: 'operator' },
    { label: '1', action: () => handleNumber('1'), type: 'number' },
    { label: '2', action: () => handleNumber('2'), type: 'number' },
    { label: '3', action: () => handleNumber('3'), type: 'number' },
    { label: '+', action: () => handleOperator('+'), type: 'operator' },
    { label: '0', action: () => handleNumber('0'), type: 'number', width: 'col-span-2' },
    { label: '.', action: () => handleNumber('.'), type: 'number' },
    { label: '=', action: handleEqual, type: 'accent' },
  ];

  const scientificButtons = [
    { label: 'sin', action: () => handleScientific('sin') },
    { label: 'cos', action: () => handleScientific('cos') },
    { label: 'tan', action: () => handleScientific('tan') },
    { label: 'log', action: () => handleScientific('log') },
    { label: 'ln', action: () => handleScientific('ln') },
    { label: '√', action: () => handleScientific('√') },
    { label: '(', action: () => handleScientific('(') },
    { label: ')', action: () => handleScientific(')') },
    { label: '^', action: () => handleOperator('^') }, // Use operator for power? Or scientific? Math.pow(a,b) vs a**b. Operator is better for UX: 2 ^ 3.
    { label: 'π', action: () => handleScientific('π') },
  ];

  return (
    <div className={`glass bg-white/60 dark:bg-black/60 p-6 rounded-3xl shadow-2xl transition-all duration-300 mx-auto ${isScientific ? 'w-full max-w-[600px]' : 'w-full max-w-[320px]'}`}>
      <div className="mb-6 flex gap-4">
        {/* Toggle Button */}
        <button 
           onClick={() => setIsScientific(!isScientific)}
           className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-gray-500 hover:text-black dark:bg-white/10 dark:hover:bg-white/20 dark:text-white/60 dark:hover:text-white transition-colors self-end mb-2"
           title={isScientific ? "Скрыть функции" : "Больше функций"}
        >
           {isScientific ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
        </button>

        {/* Display */}
        <div className="flex-1 text-right overflow-hidden">
          <div className="text-gray-500 dark:text-white/60 text-sm h-6 mb-1 truncate">{expression}</div>
          <div className="text-black dark:text-white text-5xl font-light tracking-wide truncate">
            {display}
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        {/* Scientific Panel */}
        <div className={`grid grid-cols-2 gap-3 transition-all duration-300 overflow-hidden ${isScientific ? 'w-[140px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
          {scientificButtons.map((btn) => (
             <button
               key={btn.label}
               onClick={btn.action}
               className="h-16 rounded-2xl text-lg font-medium bg-black/5 text-black hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center"
             >
               {btn.label}
             </button>
          ))}
        </div>

        {/* Standard Panel */}
        <div className={`grid grid-cols-4 gap-3 flex-1 transition-all duration-300 ${!isScientific ? '-ml-3' : ''}`}>
          {standardButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className={`
                h-16 rounded-2xl text-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center
                ${btn.width || ''}
                ${btn.type === 'number' ? 'bg-black/5 text-black hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20' : ''}
                ${btn.type === 'operator' ? 'bg-orange-500 text-black hover:bg-orange-400 shadow-lg shadow-orange-500/30 dark:text-white' : ''}
                ${btn.type === 'secondary' ? 'bg-black/10 text-black hover:bg-black/20 dark:bg-white/20 dark:text-white dark:hover:bg-white/30' : ''}
                ${btn.type === 'accent' ? 'bg-orange-500 text-black hover:bg-orange-400 shadow-lg shadow-orange-500/30 dark:text-white' : ''}
              `}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}