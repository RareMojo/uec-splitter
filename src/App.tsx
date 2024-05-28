import { useState, useEffect, useRef } from 'react';
import './index.css';
import backgroundImages from './vars';
import { shuffleArray, preloadImage, calculateSplitAmount, updateLocalStorageWithData } from './helpers';

// Define interfaces for types used in your application
interface HistoryItem {
  totalAmount: string;
  finalAmountPerPerson: string;
  timestamp: string;
  groupSize: number;
}

interface SplitResult {
  totalAmount: string;
  numPeople: string;
  transferFee: string;
  totalFeesResult: string;
  finalAmountPerPerson: string;
}

// Import NodeJS namespace for Timeout type
declare global {
  namespace NodeJS {
    interface Timeout {}
  }
}

function App() {
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [numPeople, setNumPeople] = useState<string>(localStorage.getItem('numPeople') || '2');
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [showResultCard, setShowResultCard] = useState<boolean>(false);
  const totalCapableAmount = 999999999999999;
  const hideHistoryTimerRef = useRef<number | NodeJS.Timeout | null>(null);

  const [currentBackgroundImage, setCurrentBackgroundImage] = useState<string>('');
  const [totalFromHistory, setTotalFromHistory] = useState<number>(0);
  const [personalTotal, setPersonalTotal] = useState<number>(0);

  function setRandomBackground() {
    const index = Math.floor(Math.random() * backgroundImages.length);
    const nextIndex = (index + 1) % backgroundImages.length;
    setCurrentBackgroundImage(backgroundImages[index]);
    preloadImage(backgroundImages[nextIndex]);
  }

  useEffect(() => {
    shuffleArray(backgroundImages);
    setRandomBackground();
  }, []);

  useEffect(() => {
    document.body.style.backgroundImage = `url(${currentBackgroundImage})`;
  }, [currentBackgroundImage]);

  useEffect(() => {
    const savedNumPeople = localStorage.getItem('numPeople');
    if (savedNumPeople !== null) {
      setNumPeople(savedNumPeople);
    }

    const savedHistory = JSON.parse(localStorage.getItem('data') || '[]');
    setHistoryData(savedHistory);

    const total = savedHistory.reduce((acc: number, item: HistoryItem) => acc + parseFloat(item.totalAmount.replace('$', '').replace(/,/g, '')), 0);
    const personal = savedHistory.reduce((acc: number, item: HistoryItem) => acc + parseFloat(item.finalAmountPerPerson.replace('$', '').replace(/,/g, '')), 0);
    setTotalFromHistory(total);
    setPersonalTotal(personal);
  }, []);

  useEffect(() => {
    if (totalAmount) {
      setSplitResult(calculateSplitAmount(totalAmount, numPeople, totalCapableAmount));
      setShowResultCard(true);
    } else {
      setShowResultCard(false);
    }
  }, [totalAmount, numPeople]);

  useEffect(() => {
    localStorage.setItem('numPeople', numPeople);
  }, [numPeople]);

  const handleSaveToLocalStorage = () => {
    if (splitResult) {
      if (window.confirm('Are you sure you want to save the data?')) {
        const existingData = JSON.parse(localStorage.getItem('data') || '[]');
        existingData.push({ ...splitResult, timestamp: new Date().toLocaleString(), groupSize: parseInt(numPeople) });
        localStorage.setItem('data', JSON.stringify(existingData));
        setHistoryData(existingData);

        const total = existingData.reduce((acc: number, item: HistoryItem) => acc + parseFloat(item.totalAmount.replace('$', '').replace(/,/g, '')), 0);
        const personal = existingData.reduce((acc: number, item: HistoryItem) => acc + parseFloat(item.finalAmountPerPerson.replace('$', '').replace(/,/g, '')), 0);
        setTotalFromHistory(total);
        setPersonalTotal(personal);
      }
    }
  };

  const handleExport = () => {
    const localStorageData = localStorage.getItem('data');
    const blob = new Blob([localStorageData || ''], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'uec-split-history.json';
    a.click();
  };

  const resetForm = () => {
    setTotalAmount('');
    setNumPeople('2');
    setSplitResult(null);
    setShowResultCard(false);
    setShowHistory(false);
  };

  const loadHistoryData = (data: HistoryItem) => {
    setTotalAmount(data.totalAmount.replace('$', '').replace(/,/g, ''));
    setNumPeople(data.groupSize.toString());
    setSplitResult({
      totalAmount: data.totalAmount,
      numPeople: data.groupSize.toString(),
      transferFee: '', // or any default value
      totalFeesResult: '', // or any default value
      finalAmountPerPerson: data.finalAmountPerPerson
    });
    setShowResultCard(true);
  };

  const handleMouseEnterHistory = () => {
    if (hideHistoryTimerRef.current) {
      clearTimeout(hideHistoryTimerRef.current as number);
      hideHistoryTimerRef.current = null;
    }
    setShowHistory(true);
  };

  const handleMouseLeaveHistory = () => {
    hideHistoryTimerRef.current = setTimeout(() => {
      setShowHistory(false);
    }, 500);
  };

  const handleImport = () => {
    if (window.confirm('Do you want to import new data?')) {
        if (window.confirm('Do you want to clear the existing history before importing new data?')) {
            localStorage.removeItem('data');
            setHistoryData([]);
            setTotalFromHistory(0);
            setPersonalTotal(0);
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event: ProgressEvent<FileReader>) => {
                  const importedData = event.target?.result as string;
                  if (importedData) {
                    const parsedData = JSON.parse(importedData);
                    const updatedData = updateLocalStorageWithData(parsedData);
                    setHistoryData(prevHistory => [...prevHistory, ...updatedData]);

                    const total = updatedData.reduce((acc: number, item: HistoryItem) => acc + parseFloat(item.totalAmount.replace('$', '').replace(/,/g, '')), 0);
                    const personal = updatedData.reduce((acc: number, item: HistoryItem) => acc + parseFloat(item.finalAmountPerPerson.replace('$', '').replace(/,/g, '')), 0);
                    setTotalFromHistory(prevTotal => prevTotal + total);
                    setPersonalTotal(prevPersonal => prevPersonal + personal);
                  }
              };
              reader.readAsText(file);
            }
        };
        input.click();
    }
};

  return (
    <>
      <div className="topnav">
        <a href="#" onClick={resetForm}>Home</a>
        <a href="#" onClick={() => setShowHistory(!showHistory)}>History</a>
        <a href="#" onClick={handleImport}>Import</a>
        <a href="#" onClick={handleExport}>Export</a>
        <a href="readme.md">Help</a>
      </div>

      {showHistory && (
        <div
            id="historyContainer"
            className={showHistory ? "show" : "hide"}
            onMouseEnter={handleMouseEnterHistory}
            onMouseLeave={handleMouseLeaveHistory}
          >
          <ul>
          <div className="history-item">Historic Total: ${totalFromHistory.toLocaleString()}<br></br>Personal Total: ${personalTotal.toLocaleString()}</div>
            {historyData.length > 0 ? (
              historyData.map((item, index) => (
                <li key={index} className="history-item" onClick={() => loadHistoryData(item)}>
                  <div className="history-date">{item.timestamp}</div>
                  <div className="history-content">
                    <span>{item.totalAmount} with {item.groupSize} people</span>
                    <span className="history-content">{item.finalAmountPerPerson} per person</span>
                  </div>
                </li>
              ))
            ) : null}
          </ul>
          {historyData.length > 0 && (
            <center><button onClick={() => {
              if (window.confirm('Are you sure you want to clear the history?')) {
                localStorage.removeItem('data');
                setHistoryData([]);
                setTotalFromHistory(0);
                setPersonalTotal(0);
              }
            }}>Clear History</button></center>
          )}
        </div>
        
      )}

      <div className="logo"></div>
      <div className="corner-logo"></div>

      <div className="container" id="forms">
        <div className="form-group">
          <label htmlFor="totalAmount">Total Amount ($):</label>
          <input type="number" id="totalAmount" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} min="0" aria-label="Total Amount in dollars" />
          <br />
          <label htmlFor="numPeople">Number of People: {numPeople}</label>
          <input type="range" id="numPeople" value={numPeople} onChange={e => setNumPeople(e.target.value)} min="2" max="12" step="1" aria-label="Number of People" />
        </div>
      </div>

      {showResultCard && (
        <div className={`result-card ${showResultCard ? 'result-card-show' : ''}`}>
          {splitResult && (
            <>
              <p className="result-item">
                <span className="label">Total Amount:</span>
                <span className="amount">{splitResult.totalAmount}</span>
              </p>
              <p className="result-item">
                <span className="label">Total People:</span>
                <span className="amount">{splitResult.numPeople}</span>
              </p>
              <p className="result-item">
                <span className="label">Transfer Fee:</span>
                <span className="amount">{splitResult.transferFee}</span>
              </p>
              <p className="result-item">
                <span className="label">Total Fees:</span>
                <span className="amount">{splitResult.totalFeesResult}</span>
              </p>
              <p className="result-item">
                <span className="label">Adj. Amount to Send:</span>
                <span className="amount">{splitResult.finalAmountPerPerson}</span>
              </p>

              <div className="result-item">
              <button onClick={() => {
                handleSaveToLocalStorage();
                resetForm();
              }}>Save Data</button>
              </div>
            </>
          )}
        </div>
      )}

      <footer className="footer">
        <div><a href="https://robertsspaceindustries.com/star-citizen">Star Citizen</a> and <a href="https://robertsspaceindustries.com/">Roberts Space Industries</a> are registered trademarks of<br></br><a href="https://cloudimperiumgames.com/">© 2024 Cloud Imperium Rights LLC and Cloud Imperium Rights Ltd.</a>.</div>
        <div>© 2024 <a href="https://github.com/RareMojo">Nick 'RareMojo' Rejcek</a></div>
      </footer>
    </>
  );
}

export default App;
