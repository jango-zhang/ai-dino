import { Runner } from './game';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './game/constants';
import { JNN } from './jnn/fm';
import { create as createLegend, update as updateLegend } from './jnn/legend';

let dino = null;
let trainingData = {
  input: [],
  output: [],
};
let nn: JNN = null;

const convertStateToVector = (state) => {
  if (state) {
    return [
      state.obstacleX / CANVAS_WIDTH,
      state.obstacleWidth / CANVAS_WIDTH,
      state.speed / 100
    ];
  }
  return [0, 0, 0];
}

const sleep = (timeout = 1000) => new Promise(resolve => setTimeout(() => resolve(void 0), timeout));
const handleFirstTime = () => {
  // init nn
  nn = new JNN({
    inputCount: 3,
    hiddenLayers: [4, 5],
    outputCount: 2,
    learnReate: 0.5,
    epoch: 20,
  });
  createLegend();
  updateLegend(nn, new Array(nn.options.inputCount).fill('-'));
}

const handleReset = async () => {
  await sleep(1000);
  console.log(trainingData);
  // training data
  nn.fit(trainingData.input, trainingData.output, {
    async onEpochFinish(trainData) {
      // updateLegend(nn, trainData);
    }
  });
};

const handleCrash = async (dino) => {
  let input = null;
  let output = null;

  if (dino.jumping) {
    // 获取最后一次跳跃状态
    input = convertStateToVector(dino.lastJumpingState);
    // 不跳
    output = [1, 0];
  } else {
    // 获取当前行走状态
    input = convertStateToVector(dino.lastRunningState);
    // 跳
    output = [0, 1];
  }

  trainingData.input.push(input);
  trainingData.output.push(output);
};

const handleRunning = async (dino, state) => {
  const input = convertStateToVector(state);
  let action = 0;

  // running
  if (dino.jumping === false) {
    const [output0, output1] = nn.predict(input);

    if (output1 > output0) {
      // need jump
      action = 1;
      dino.lastJumpingState = state;
    } else {
      // keep running
      action = 0;
      dino.lastRunningState = state;
    }
  }
  // jumping
  await sleep(10)
  updateLegend(nn, input);
  return action;
};

document.addEventListener('DOMContentLoaded', () => {
  dino = new Runner('.game', {
    DINO_COUNT: 1,
    onFirstTime: handleFirstTime,
    onReset: handleReset,
    onCrash: handleCrash,
    onRunning: handleRunning
  });
  dino.init();
});