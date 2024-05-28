const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };
  
  const preloadImage = (src) => {
    const img = new Image();
    img.src = src;
  };
  
  const calculateSplitAmount = (totalAmount, numPeople, totalCapableAmount) => {
    const amount = parseFloat(totalAmount);
    const people = parseInt(numPeople);
  
    if (!isNaN(amount) && !isNaN(people) && people > 0 && amount <= totalCapableAmount) {
      const initialAmountPerPerson = Math.round(amount / people);
      const transferFee = Math.round(initialAmountPerPerson * 0.005);
      const finalAmountPerPerson = initialAmountPerPerson - transferFee;
      const totalFeesResult = transferFee * people;
      return {
        totalAmount: `$${amount.toLocaleString()}`,
        numPeople: people.toString(),
        transferFee: `$${transferFee.toLocaleString()}`,
        totalFeesResult: `$${totalFeesResult.toLocaleString()}`,
        finalAmountPerPerson: `$${finalAmountPerPerson.toLocaleString()}`
      };
    } else if (amount > totalCapableAmount) {
      alert('Please do not exceed $999,999,999,999,999.');
      return null;
    } else {
      return null;
    }
  };
  
  const updateLocalStorageWithData = (data) => {
    const existingData = JSON.parse(localStorage.getItem('data') || '[]');
    existingData.push(...data);
    localStorage.setItem('data', JSON.stringify(existingData));
    return existingData;
  };
  
  export {
    shuffleArray,
    preloadImage,
    calculateSplitAmount,
    updateLocalStorageWithData
  };
  