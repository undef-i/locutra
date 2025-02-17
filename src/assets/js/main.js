/**
 * Locutra - A geography quiz game.
 * Copyright (c) 2024 Noxylva
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as echarts from 'echarts';
import '../css/style.css';

const state = {
  score: 0,
  currentArea: null,
  gameOver: false,
  usedAreas: new Set(),
  chart: null,
  currentOptions: [],
  loading: true,
  message: '',
  isCorrect: false,
  regionList: null,
  isAnswering: false,
  totalAnswers: 0,
  correctAnswers: 0,
  rawScore: 0,
  adjustedScore: 0
};

const MAX_QUESTIONS = 25;

let rawScore = 0;
let adjustedScore = 0;

const elements = {
  loading: document.getElementById('loading'),
  quizContainer: document.getElementById('quiz-container'),
  gameOver: document.getElementById('game-over'),
  score: document.getElementById('score'),
  finalScore: document.getElementById('final-score'),
  mapChart: document.getElementById('map-chart'),
  options: document.getElementById('options')
};

const DISTRIBUTION_COEFFICIENTS = [
    0.030211826004335650547316660663454968016594648361206,
    0.013518574829454534230504123397841757408384044403194,
    -0.0093674692849267450679070398401925165012707211507788,
    0.0021659680488067420369504746920794127700710767347410,
    -0.00027898940306635343236880066067764022572265980454622,
    0.000023053889416584420159133707763337580849212295225800,
    -1.2965650651843637690227325338250341317695790824096e-6,
    5.0601287255789775418234906926694095432675192993297e-8,
    -1.3436511856543748062634214106789898378414857454583e-9,
    2.1754773033924342677430788722117185179858679870413e-11,
    -9.5537118135007520031556745915800938398789485350631e-14,
    -4.8830170654929876010800931090395724702494825537098e-15,
    1.3771659799247569255047169013659563043094492324512e-16,
    -1.7090617264269014104296368963230063678999264733767e-18,
    6.7480936402211126262053013723543231821994389999740e-21,
    1.2351753738877223217020259884651930061251013644236e-22,
    -2.4629444823606767373960585228699896712818695300858e-24,
    2.1872957757460025840209525820152268933218404347937e-26,
    -1.1258800720698931828716203974387697686569662945859e-28,
    3.2569863909040321972443819985850002388622535999350e-31,
    -4.1285411726670488194438240742597322709194044789584e-34
];

class GameState {
    constructor() {
        this.rawScore = 0;
        this.adjustedScore = 0;
        this.totalAnswers = 0;
        this.correctAnswers = 0;
    }

    update_score(isCorrect) {
        this.totalAnswers++;
        if (isCorrect) {
            this.rawScore += 4.0;
            this.correctAnswers++;
        }
        
        const baseScore = Math.max(0.0, (4.0/3.0) * (this.rawScore - this.totalAnswers));
        this.adjustedScore = (43.0 * baseScore) / 28.0 - (3.0 * baseScore ** 2) / 560.0;
        
        return this.adjustedScore;
    }

    get_accuracy() {
        if (this.totalAnswers === 0) return 0;
        return Math.round((this.correctAnswers / this.totalAnswers) * 100);
    }

    total_answers() {
        return this.totalAnswers;
    }

    correct_answers() {
        return this.correctAnswers;
    }
}

function evaluatePolynomial(x, coefficients) {
    let result = 0.0;
    let power = 1.0;
    
    for (const coef of coefficients) {
        result += coef * power;
        power *= x;
    }
    
    return Math.max(0.0, result);
}

function calculatePercentile(score) {
    function trapezoidalIntegral(start, end, steps, coefficients) {
        const dx = (end - start) / steps;
        let sum = evaluatePolynomial(start, coefficients) / 2.0;
        sum += evaluatePolynomial(end, coefficients) / 2.0;
        
        for (let i = 1; i < steps; i++) {
            const x = start + i * dx;
            sum += evaluatePolynomial(x, coefficients);
        }
        
        return sum * dx;
    }
    
    const steps = 1000;
    const totalArea = trapezoidalIntegral(0.0, 100.0, steps, DISTRIBUTION_COEFFICIENTS);
    const areaBelow = trapezoidalIntegral(0.0, score, steps, DISTRIBUTION_COEFFICIENTS);
    
    return Math.round((areaBelow / totalArea) * 100);
}

function calculateRank(score) {
    const percentile = calculatePercentile(score);
    
    if (percentile >= 95) return "S";
    if (percentile >= 80) return "A";
    if (percentile >= 60) return "B";
    if (percentile >= 40) return "C";
    if (percentile >= 20) return "D";
    return "F";
}

function drawDistributionChart(score) {
  const chartDom = document.getElementById('score-distribution');
  const existingChart = echarts.getInstanceByDom(chartDom);
  if (existingChart) {
    existingChart.dispose();
  }
  
  const chart = echarts.init(chartDom, null, {
    renderer: 'svg',
    width: chartDom.clientWidth,
    height: chartDom.clientHeight
  });
  
  const coefficients = DISTRIBUTION_COEFFICIENTS;
  
  const data = [];
  for (let x = 0; x <= 100; x++) {
    const y = evaluatePolynomial(x, coefficients);
    data.push([x, y]);
  }
  
  const scoreY = evaluatePolynomial(score, coefficients);
  const startY = evaluatePolynomial(0, coefficients);
  const endY = evaluatePolynomial(100, coefficients);
  
  const option = {
    animation: false,
    grid: {
      top: 10,
      right: 15,
      bottom: 30,
      left: 15,
      show: false
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      interval: 20,
      axisLine: {
        show: true,
        lineStyle: {
          color: '#000',
          width: 2
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [
      {
        data: [[0, 0], ...data, [100, 0]],
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: {
          color: 'transparent'
        },
        lineStyle: {
          color: '#000',
          width: 2,
          type: 'solid'
        },
        markLine: {
          silent: true,
          symbol: ['none', 'none'],
          lineStyle: {
            color: '#000',
            width: 2,
            type: 'solid'
          },
          label: {
            formatter: '你',
            position: 'start',
            fontSize: 10,
            fontWeight: 'bold',
            color: '#000',
            padding: [0, 0, 20, 0],
            distance: 5
          },
          data: [
            [{
              coord: [score, 0]
            }, {
              coord: [score, scoreY]
            }]
          ]
        }
      },
      {
        data: [[0, 0], ...data.filter(point => point[0] <= score), [score, 0]],
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: {
          color: {
            type: 'pattern',
            pattern: 'path://M-1,1 L1,-1',
            backgroundColor: 'transparent'
          },
          opacity: 1
        },
        lineStyle: {
          width: 0
        },
        zlevel: -1
      }
    ]
  };
  
  chart.setOption(option);
  
  return chart;
}

function initChart() {
  if (!elements.mapChart) return;
  
  try {
    if (state.chart) {
      state.chart.dispose();
    }
    
    const container = elements.mapChart;
    const width = container.clientWidth;
    const height = container.clientHeight || width * 0.75;
    
    state.chart = echarts.init(elements.mapChart, null, {
      width: width,
      height: height,
      renderer: 'svg'
    });
    
    const option = {
      series: [{
        type: 'map',
        map: 'china',
        roam: false,
        aspectScale: 1,
        zoom: 1,
        layoutCenter: ['50%', '50%'],
        layoutSize: '95%',
        selectedMode: false,
        label: {
          show: false
        },
        itemStyle: {
          areaColor: '#fff',
          borderColor: '#000',
          borderWidth: 2
        },
        emphasis: {
          itemStyle: {
            areaColor: '#fff',
            borderColor: '#000',
            borderWidth: 2
          },
          label: {
            show: false
          }
        }
      }]
    };
    
    state.chart.setOption(option);
    state.chart.resize({
      width: width,
      height: height
    });
    
    window.addEventListener('resize', () => {
      if (state.chart) {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight || newWidth * 0.75;
        state.chart.resize({
          width: newWidth,
          height: newHeight
        });
      }
    });
    
    return true;
  } catch (error) {
    console.error('Chart initialization failed:', error);
    return false;
  }
}

async function initApp() {
  try {
    showLoading(true);
  
    if (!window.wasmHelpers || !window.wasmHelpers.get_geo_data) {
      throw new Error('WASM helpers not initialized');
    }

    window.gameState = new GameState();
    
    const geoDataStr = window.wasmHelpers.get_geo_data();
    const geoData = JSON.parse(geoDataStr);
    
    console.log('Registering map with data:', {
      featureCount: geoData.features?.length,
      type: geoData.type
    });
    
    echarts.registerMap('china', geoData);
    
    if (!echarts.getMap('china')) {
      throw new Error('Failed to register China map');
    }
    
    state.regionList = [];
    for (let key in geoData.features) {
      const feature = geoData.features[key];
      state.regionList.push({
        id: key,
        name: feature.properties.name,
        geometry: feature.geometry
      });
    }
    
    if (!initChart()) {
      throw new Error('Failed to initialize chart');
    }
    
    console.log('Map initialized:', state.regionList.length);
    
    updateProgress();
    showLoading(false);
    startNewQuestion();
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    console.error('Detailed error:', error.stack);
    elements.loading.textContent = 'Loading failed. Please refresh and try again. ' + error.message;
  }
}

async function loadRegionData(areaId) {
  try {
    const selectedArea = state.regionList.find(area => area.id === areaId);
    if (!selectedArea) {
      throw new Error('Area data not found');
    }
    
    const areaData = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          name: selectedArea.name
        },
        geometry: selectedArea.geometry
      }]
    };
    
    const mapId = `map_${areaId}`;
    echarts.registerMap(mapId, areaData);
    return mapId;
  } catch (error) {
    console.error('Failed to load area data:', error);
    throw error;
  }
}

async function startNewQuestion() {
  if (!state.regionList || state.usedAreas.size >= MAX_QUESTIONS) {
    showGameOver();
    return;
  }
  
  try {
    const availableAreas = state.regionList.filter(
      area => !state.usedAreas.has(area.id)
    );
    
    if (availableAreas.length === 0) {
      showGameOver();
      return;
    }
    
    document.getElementById('current-question').textContent = state.usedAreas.size + 1;
    
    const randomIndex = Math.floor(Math.random() * availableAreas.length);
    state.currentArea = availableAreas[randomIndex];
    state.usedAreas.add(state.currentArea.id);
    
    const mapId = await loadRegionData(state.currentArea.id);
    
    state.chart.setOption({
      series: [{
        type: 'map',
        map: mapId,
        roam: false,
        aspectScale: 1,
        zoom: 1,
        layoutCenter: ['50%', '50%'],
        layoutSize: '95%',
        label: {
          show: false
        },
        itemStyle: {
          areaColor: '#fff',
          borderColor: '#000',
          borderWidth: 2
        },
        emphasis: {
          itemStyle: {
            areaColor: '#fff',
            borderColor: '#000',
            borderWidth: 2
          },
          label: {
            show: false
          }
        },
        select: {
          disabled: true
        }
      }]
    });
    
    state.chart.resize({
      width: 'auto',
      height: 'auto'
    });
    
    generateOptions();
  } catch (error) {
    console.error('Failed to generate new question:', error);
  }
}

function generateOptions() {
  const correctAnswer = state.currentArea.name;
  const otherAreas = state.regionList
    .filter(area => area.name !== correctAnswer)
    .map(area => area.name);
  
  const wrongOptions = shuffleArray(otherAreas).slice(0, 3);
  state.currentOptions = shuffleArray([correctAnswer, ...wrongOptions]);
  
  elements.options.innerHTML = state.currentOptions
    .map(option => `
      <button onclick="checkAnswer('${option}')" class="option-btn">
        ${option}
      </button>
    `).join('');
  
  adjustButtonTextSizes();
}

function checkAnswer(selectedAnswer) {
  if (state.isAnswering) return;
  state.isAnswering = true;

  const correctAnswer = state.currentArea.name;
  const isCorrect = selectedAnswer === correctAnswer;
  
  try {
    state.adjustedScore = window.gameState.update_score(isCorrect);
    
    const currentAccuracy = window.gameState.get_accuracy();
    const correctCount = window.gameState.correct_answers();
    const totalCount = window.gameState.total_answers();
    
    document.getElementById('current-accuracy').textContent = currentAccuracy;
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('wrong-count').textContent = totalCount - correctCount;
    
    document.getElementById('adjusted-score').textContent = 
      Math.round(state.adjustedScore);
    
    state.totalAnswers = totalCount;
    state.correctAnswers = correctCount;
    
    updateProgress();
    
    const buttons = elements.options.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = true;
      if (button.textContent.trim() === correctAnswer) {
        button.classList.add('correct');
      } else if (button.textContent.trim() === selectedAnswer && !isCorrect) {
        button.classList.add('wrong');
      }
    });
    
    setTimeout(() => {
      state.isAnswering = false;
      startNewQuestion();
    }, 600);
  } catch (error) {
    console.error('Error in checkAnswer:', error);
  }
}

function showGameOver() {
  elements.quizContainer.style.display = 'none';
  elements.gameOver.style.display = 'block';
  
  try {
    document.getElementById('final-adjusted-score').textContent = 
      Math.round(state.adjustedScore);
    
    const percentile = calculatePercentile(state.adjustedScore);
    document.getElementById('percentile').textContent = percentile;
    
    const accuracy = window.gameState.get_accuracy();
    document.getElementById('accuracy').textContent = accuracy;
    
    const rank = calculateRank(state.adjustedScore);
    const rankElement = document.getElementById('rank-grade');
    rankElement.textContent = rank;
    rankElement.className = 'rank-grade rank-' + rank.toLowerCase();

    let distributionChart = drawDistributionChart(state.adjustedScore);
    
    let resizeTimeout;
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        distributionChart = drawDistributionChart(state.adjustedScore);
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    const oldRestartGame = window.restartGame;
    window.restartGame = () => {
      window.removeEventListener('resize', handleResize);
      if (distributionChart) {
        distributionChart.dispose();
      }
      oldRestartGame();
    };
  } catch (error) {
    console.error('Error in showGameOver:', error);
  }
}

function restartGame() {
  try {
    window.gameState = new GameState();
    
    state.rawScore = 0;
    state.adjustedScore = 0;
    state.usedAreas.clear();
    state.gameOver = false;
    state.totalAnswers = 0;
    state.correctAnswers = 0;
    
    document.getElementById('adjusted-score').textContent = '0';
    elements.gameOver.style.display = 'none';
    elements.quizContainer.style.display = 'block';
    
    const progressElement = document.getElementById('progress');
    if (progressElement) {
      progressElement.style.width = '0%';
    }

    document.body.classList.remove('no-scroll');
    
    document.getElementById('current-accuracy').textContent = '0';
    document.getElementById('correct-count').textContent = '0';
    document.getElementById('wrong-count').textContent = '0';

    startNewQuestion();
  } catch (error) {
    console.error('Error in restartGame:', error);
  }
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

window.initApp = initApp;

window.checkAnswer = checkAnswer;
window.restartGame = restartGame;

function showLoading(show) {
  const loadingElement = document.getElementById('loading');
  const progressBar = loadingElement.querySelector('.loading-progress-bar');
  const loadingText = loadingElement.querySelector('.loading-text');
  
  if (show) {
    loadingElement.style.display = 'flex';
    loadingElement.style.opacity = '1';
    loadingElement.style.visibility = 'visible';
    elements.quizContainer.style.display = 'none';
    
    let progress = 0;
    const updateProgress = () => {
      if (progress < 90) {
        progress += Math.random() * 30;
        progress = Math.min(progress, 90);
        progressBar.style.width = `${progress}%`;
        setTimeout(updateProgress, 100 + Math.random() * 200);
      }
    };
    updateProgress();
  } else {
    progressBar.style.width = '100%';
    loadingElement.style.opacity = '0';
    loadingElement.style.visibility = 'hidden';
    elements.quizContainer.style.display = 'block';
    
    setTimeout(() => {
      loadingElement.style.display = 'none';
      loadingElement.style.zIndex = '-1';
    }, 100);
  }
}

function updateProgress() {
  if (!state.regionList) return;
  const progress = (state.usedAreas.size / MAX_QUESTIONS) * 100;
  const progressElement = document.getElementById('progress');
  if (progressElement) {
    progressElement.style.width = `${progress}%`;
  }
}

function adjustButtonTextSizes() {
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(button => {
    let min = 8;
    let max = 16;
    let fontSize = max;
    
    while (max - min > 0.5) {
      fontSize = (max + min) / 2;
      button.style.fontSize = `${fontSize}px`;
      
      if (button.scrollWidth > button.clientWidth) {
        max = fontSize;
      } else {
        min = fontSize;
      }
    }
    
    button.style.fontSize = `${min}px`;
  });
}

let resizeTimeout;
window.addEventListener('resize', () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = setTimeout(() => {
    adjustButtonTextSizes();
  }, 100);
});

async function initWasm() {
  try {

    await initApp();
  } catch (error) {
    console.error('Failed to initialize WASM:', error);
    elements.loading.textContent = 'Failed to load WASM. Please refresh and try again.';
  }
}

window.initWasm = initWasm;

export {
  initWasm,
  checkAnswer,
  restartGame
};