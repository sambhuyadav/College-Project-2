    const apiKey = 'X5XJM31G7XSVNL79'; 
    const GEMINI_API_KEY = "AIzaSyAGomd1O29kJTH5dpmhfpqgzXLWiQHG4eE"; 
    const stocks = [];
    let stockChart = null;
    let currentStockIndex = 0;
    let intervalId;
    let isUsingDummyData = true; 
    const stockNames = {};


    
    const dummyData = {
      'AMZN': [3300, 3320, 3340, 3360, 3380, 3400, 3420],
      'BLK': [750, 760, 770, 780, 790, 800, 810],
      'META': [350, 355, 360, 365, 370, 375, 380],
      'TSLA': [700, 710, 720, 730, 740, 750, 760]
    };


    
    const dummyCompanyNames = {
      'AMZN': 'Amazon',
      'BLK': 'BlackRock',
      'META': 'Meta (Facebook)',
      'TSLA': 'Tesla'
    };


    
    
    let currentCompanyName = ""; 

    document.getElementById("addStock").addEventListener("click", function () {
        const stockSymbolInput = document.getElementById("stockSymbol");
        currentCompanyName = stockSymbolInput.value.trim().toUpperCase();
        
        if (currentCompanyName) {
            const stockListDiv = document.getElementById("stockList");
            const stockItem = document.createElement("div");
            stockItem.classList.add("stock-item"); 
            stockItem.innerHTML = `<p>${currentCompanyName}</p>`;
            stockListDiv.appendChild(stockItem);
            stockSymbolInput.value = "";
        }
    });

    console.log(currentCompanyName)
   

    const chatHistory = []; 

async function fetchGeminiResponse(userInput) {
    try {
      
        const fullPrompt = [
            ...chatHistory.map(entry => ({ role: entry.role, parts: [{ text: entry.text }] })), 
            { role: "user", parts: [{ text: userInput }] } 
        ];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: fullPrompt })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            let final = data.candidates[0].content.parts[0].text;

            chatHistory.push({ role: "user", text: userInput });
            chatHistory.push({ role: "model", text: final });

            return final;
        } else {
            return "Sorry, I couldn't fetch the information.";
        }
    } catch (error) {
        console.error("Error fetching data from Gemini API:", error);
        return "Error fetching stock information.";
    }
}







  function formatGeminiResponse(response) {
    return response
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\* (.*?)\n/g, "<li>$1</li>") 
        .replace(/\n/g, "<br>"); 
}


    
  
    document.getElementById("stockHistoryButton").addEventListener("click", async () => {
      const detailsDiv = document.getElementById("stockHistoryDetails");
      const parentDiv = document.getElementById("performanceSummary");
      const stockHistoryButton = document.getElementById("stockHistoryButton");


      stockHistoryButton.innerHTML = "Loading...";
      stockHistoryButton.classList.add("loading");
    
      const prompt =  `Give a summary of the ${currentCompanyName}'s stock performance and history.`
      console.log(prompt)
      const stockHistory = await fetchGeminiResponse(prompt);

      stockHistoryButton.innerHTML = "Get Stock History";
      stockHistoryButton.classList.remove("loading");
      
    
      detailsDiv.innerHTML = `<p class="history-button">Question: <b>${prompt}</b></p>`+`<p>${formatGeminiResponse(stockHistory)}</p>`;
      
      document.getElementById("stockHistoryButton").remove();

    
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = "Want to know more...";
      searchInput.classList.add("history-button");
    
      const searchButton = document.createElement("button");
      searchButton.innerText = "Search";
      searchButton.classList.add("search-button");
    
      parentDiv.appendChild(searchInput);
      parentDiv.appendChild(searchButton);
    
      
      searchButton.addEventListener("click", async () => {
        const query = searchInput.value.trim();
        if (query) {

          searchButton.innerHTML = "Searching...";
          searchButton.classList.add("loading");

          const response = await fetchGeminiResponse(query);

          searchButton.innerHTML = "Search";
          searchButton.classList.remove("loading");

          const formattedResponse = `<p >${formatGeminiResponse(response)}</p>`;
          detailsDiv.innerHTML += `<p class="history-button">Question: <b>${query}</b></p>` + formattedResponse;
          searchInput.value = "";
        }
      });
    });


        
    async function fetchStockData(symbol) {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
    
        if (data['Time Series (5min)']) {
          const timeSeries = data['Time Series (5min)'];
          return Object.values(timeSeries).map(entry => parseFloat(entry['4. close'])); 
        } else {
          console.warn(`No data found for ${symbol}. Market Closed for today.`);
          return dummyData[symbol] || null;
        }
      } catch (error) {
        console.error('Error fetching stock data:', error);
        return dummyData[symbol] || null;
      }
    }



    
    async function fetchCompanyName(symbol) {
      const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${apiKey}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
    
        if (data.bestMatches && data.bestMatches.length > 0) {
          stockNames[symbol] = data.bestMatches[0]['2. name'];
        } else {
          stockNames[symbol] = symbol; 
        }
      } catch (error) {
        console.error('Error fetching company name:', error);
        stockNames[symbol] = symbol; 
      }
    }




    
    async function updateChart() {
      const ctx = document.getElementById('stockChart').getContext('2d');
      let chartData = [];
      let labels = [];
      let chartTitle = '';
    
      if (isUsingDummyData) {
        const symbols = Object.keys(dummyData);
        const symbol = symbols[currentStockIndex];
    
        chartData = [{
          label: dummyCompanyNames[symbol] || symbol,
          data: dummyData[symbol],
          borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          fill: false,
          tension: 0.4,
          cubicInterpolationMode: 'monotone',
          borderWidth: 3
        }];
    
        labels = dummyData[symbol].map((_, i) => `Time ${i + 1}`);
        chartTitle = dummyCompanyNames[symbol] || symbol;
        currentStockIndex = (currentStockIndex + 1) % symbols.length;
      } else {
        chartData = await Promise.all(stocks.map(async symbol => {
          const stockPrices = await fetchStockData(symbol);
          return {
            label: stockNames[symbol] || symbol,
            data: stockPrices,
            borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            fill: false,
            tension: 0.4,
            cubicInterpolationMode: 'monotone',
            borderWidth: 3
          };
        }));
    
        labels = chartData.length > 0 ? chartData[0].data.map((_, i) => `Time ${i + 1}`) : [];
        chartTitle = stocks.map(symbol => stockNames[symbol] || symbol).join(', ');
      }
    
      if (stockChart) {
        stockChart.destroy();
      }
    
      stockChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: chartData },
        options: {
          responsive: true,
          animation: { duration: 1500, easing: 'easeInOutCubic' },
          elements: { line: { tension: 0.4 } },
          scales: {
            x: { display: true, title: { display: true, text: 'Time' } },
            y: { display: true, title: { display: true, text: 'Price (USD)' } }
          },
          plugins: {
            title: { display: true, text: `Stock Data: ${chartTitle}`, font: { size: 18 } }
          }
        }
      });
    }
    
    function startDummyChartUpdate() {
      updateChart();
      intervalId = setInterval(updateChart, 300000);
    }



    document.getElementById('addStock').addEventListener('click', async () => {
      const symbol = document.getElementById('stockSymbol').value.toUpperCase();
      
      if (symbol && !stocks.includes(symbol)) {
        try {
          stocks.push(symbol);
          isUsingDummyData = false;
          clearInterval(intervalId);
    
          const success = await fetchCompanyName(symbol);
          
          if (!success) {
            throw new Error('Market is closed. Data is not available.');
          }
    
          await updateChart();
        } catch (error) {
          alert(error.message); 
          stocks.pop(); 
        }
      }
    });
    


    window.onload = () => {
      startDummyChartUpdate();
    };



  



















  