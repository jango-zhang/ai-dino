import { useRef, useEffect, useCallback } from 'react';
import { Runner } from '../game';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { JNN } from '../jnn/fm';
import { create as createLegend, update as updateLegend } from '../jnn/legend';

const sleep = (timeout = 1000) => new Promise(resolve => setTimeout(() => resolve(void 0), timeout));

export function useGameRunner(gameRef: React.RefObject<HTMLDivElement>, canvasRef: React.RefObject<HTMLCanvasElement>) {
  const dinoRef = useRef<any>(null);
  const nnRef = useRef<JNN>(null);
  const trainingDataRef = useRef({ input: [], output: [] });

  const convertStateToVector = useCallback((state: any) => {
    if (state) {
      return [
        state.obstacleX / CANVAS_WIDTH,
        state.obstacleWidth / CANVAS_WIDTH,
        state.speed / 100,
      ];
    }
    return [0, 0, 0];
  }, []);

  useEffect(() => {
    const gameEl = gameRef.current;
    const canvasEl = canvasRef.current;
    if (!gameEl || !canvasEl) return;

    const handleFirstTime = () => {
      nnRef.current = new JNN({
        inputCount: 3,
        hiddenLayers: [4, 5],
        outputCount: 2,
        learnReate: 0.5,
        epoch: 20,
      });
      createLegend(canvasEl);
      updateLegend(nnRef.current, new Array(nnRef.current.options.inputCount).fill('-'));
    };

    const handleReset = async () => {
      await sleep(1000);
      nnRef.current.fit(trainingDataRef.current.input, trainingDataRef.current.output, {
        async onEpochFinish() {},
      });
    };

    const handleCrash = async (dino: any) => {
      let input = null;
      let output = null;

      if (dino.jumping) {
        input = convertStateToVector(dino.lastJumpingState);
        output = [1, 0];
      } else {
        input = convertStateToVector(dino.lastRunningState);
        output = [0, 1];
      }

      trainingDataRef.current.input.push(input);
      trainingDataRef.current.output.push(output);
    };

    const handleRunning = async (dino: any, state: any) => {
      const input = convertStateToVector(state);
      let action = 0;

      if (dino.jumping === false) {
        const [output0, output1] = nnRef.current.predict(input);

        if (output1 > output0) {
          action = 1;
          dino.lastJumpingState = state;
        } else {
          action = 0;
          dino.lastRunningState = state;
        }
      }

      await sleep(10);
      updateLegend(nnRef.current, input);
      return action;
    };

    const runner = new Runner('#game', {
      DINO_COUNT: 1,
      onFirstTime: handleFirstTime,
      onReset: handleReset,
      onCrash: handleCrash,
      onRunning: handleRunning,
    });
    runner.init();
    dinoRef.current = runner;

    return () => {
      Runner.instance_ = null;
    };
  }, [gameRef, canvasRef, convertStateToVector]);
}
