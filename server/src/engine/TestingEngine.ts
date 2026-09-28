import {
  PurchasedComponent,
  RobotTestTask,
  TaskResult,
  Team,
  TestingState
} from '../types/index.js';

export class TestingEngine {
  public static readonly TASKS: RobotTestTask[] = [
    {
      id: 'test-speed',
      name: 'Speed & Acceleration Test',
      description: 'Sprint through a 20-meter straight course measuring top speed and sprint time.',
      maxScore: 100,
      icon: '⚡',
      evaluatorKey: 'speed'
    },
    {
      id: 'test-accuracy',
      name: 'Precision Trajectory & Line Tracking',
      description: 'Follow high-curvature precision tracks with zero drift and exact stopping lines.',
      maxScore: 100,
      icon: '🎯',
      evaluatorKey: 'accuracy'
    },
    {
      id: 'test-obstacle',
      name: 'Dynamic Obstacle Avoidance',
      description: 'Navigate an obstacle maze with sudden pop-up barriers at varying angles.',
      maxScore: 150,
      icon: '🛡️',
      evaluatorKey: 'obstacle'
    },
    {
      id: 'test-detection',
      name: 'Autonomous Object Recognition',
      description: 'Detect, classify, and localize target cubes in complex multi-colored lighting.',
      maxScore: 150,
      icon: '👁️',
      evaluatorKey: 'detection'
    },
    {
      id: 'test-pick-place',
      name: 'Object Pick & Place Challenge',
      description: 'Articulate arm, grasp payload object, and deposit into designated container.',
      maxScore: 200,
      icon: '🦾',
      evaluatorKey: 'pick_place'
    },
    {
      id: 'test-efficiency',
      name: 'Energy & Power Efficiency',
      description: 'Measure continuous workload endurance and electrical joule consumption.',
      maxScore: 100,
      icon: '🔋',
      evaluatorKey: 'efficiency'
    }
  ];

  public static createInitialState(): TestingState {
    const taskResults: Record<string, TaskResult> = {};
    for (const t of this.TASKS) {
      taskResults[t.id] = {
        taskId: t.id,
        taskName: t.name,
        score: 0,
        maxScore: t.maxScore,
        efficiencyRating: 0,
        completionTimeSec: 0,
        details: 'Not tested yet',
        status: 'pending'
      };
    }

    return {
      currentTestIndex: 0,
      taskResults,
      totalPerformanceScore: 0,
      testingCompleted: false
    };
  }

  /**
   * Evaluates all 6 tasks for a team robot based on their components and assembly compatibility
   */
  public static evaluateRobot(team: Team): TestingState {
    const compMap = new Map<string, PurchasedComponent>();
    for (const comp of team.components) {
      compMap.set(comp.category, comp);
    }

    const compatFactor = Math.max(0.2, (team.assembly?.compatibilityScore || 50) / 100);
    const hasCore = Boolean(
      compMap.get('chassis') && compMap.get('controller') && compMap.get('battery')
    );

    const taskResults: Record<string, TaskResult> = {};
    let totalScore = 0;

    for (const task of this.TASKS) {
      const result = this.evaluateSingleTask(task, compMap, compatFactor, hasCore);
      taskResults[task.id] = result;
      totalScore += result.score;
    }

    return {
      currentTestIndex: this.TASKS.length,
      taskResults,
      totalPerformanceScore: Math.round(totalScore),
      testingCompleted: true
    };
  }

  private static evaluateSingleTask(
    task: RobotTestTask,
    compMap: Map<string, PurchasedComponent>,
    compatFactor: number,
    hasCore: boolean
  ): TaskResult {
    if (!hasCore) {
      return {
        taskId: task.id,
        taskName: task.name,
        score: 0,
        maxScore: task.maxScore,
        efficiencyRating: 0,
        completionTimeSec: 99.9,
        details: 'Robot incomplete: Missing essential chassis, battery, or controller.',
        status: 'completed'
      };
    }

    let rawScore = 0;
    let completionTime = 12.0;
    let details = '';

    switch (task.evaluatorKey) {
      case 'speed': {
        const motor = compMap.get('motor');
        const driver = compMap.get('motor_driver');
        const wheel = compMap.get('wheel_set');
        const gearbox = compMap.get('gearbox');

        const motorRpm = motor?.capabilities.speedRpm || 0;
        const motorWatts = motor?.capabilities.powerWatts || 0;
        const wheelRating = wheel?.capabilities.rating || 30;
        const gearRating = gearbox?.capabilities.rating || 30;
        const driverRating = driver?.capabilities.rating || 20;

        if (!motor) {
          rawScore = 0;
          completionTime = 45.0;
          details = 'No motor installed; robot unable to move.';
        } else {
          // Score out of 100
          const driveRatio = (motorRpm / 250) * 0.45 + (wheelRating / 100) * 0.25 + (gearRating / 100) * 0.15 + (driverRating / 100) * 0.15;
          rawScore = Math.min(100, Math.round(driveRatio * 100 * compatFactor));
          completionTime = Math.max(3.2, Number((18.0 - (rawScore / 100) * 14.0).toFixed(2)));
          details = `Top sprint achieved in ${completionTime}s. Drive ratio factor: ${(driveRatio * 100).toFixed(0)}%.`;
        }
        break;
      }

      case 'accuracy': {
        const encoder = compMap.get('encoder');
        const imu = compMap.get('imu');
        const line = compMap.get('line_sensor');
        const controller = compMap.get('controller');

        const encRating = encoder?.capabilities.rating || 10;
        const imuRating = imu?.capabilities.rating || 10;
        const lineRating = line?.capabilities.rating || 10;
        const ctlMips = controller?.capabilities.computeRateMips || 20;

        const navRatio = (lineRating / 100) * 0.35 + (encRating / 100) * 0.25 + (imuRating / 100) * 0.20 + (Math.min(ctlMips, 400) / 400) * 0.20;
        rawScore = Math.min(100, Math.round(navRatio * 100 * compatFactor));
        completionTime = Math.max(4.0, Number((15.0 - (rawScore / 100) * 9.5).toFixed(2)));
        details = `Track drift: ${(Math.max(1, (100 - rawScore) * 0.15)).toFixed(1)}mm. Sensor fusion lock: ${(navRatio * 100).toFixed(0)}%.`;
        break;
      }

      case 'obstacle': {
        const ultra = compMap.get('ultrasonic_sensor');
        const dist = compMap.get('distance_sensor');
        const imu = compMap.get('imu');
        const driver = compMap.get('motor_driver');

        const ultraDist = ultra?.capabilities.detectionRangeMeters || 0.5;
        const distDist = dist?.capabilities.detectionRangeMeters || 1.0;
        const imuRating = imu?.capabilities.rating || 15;
        const driverRating = driver?.capabilities.rating || 20;

        const senseScore = Math.min(1.0, (ultraDist / 4.0) * 0.4 + (distDist / 12.0) * 0.35 + (imuRating / 100) * 0.15 + (driverRating / 100) * 0.10);
        rawScore = Math.min(150, Math.round(senseScore * 150 * compatFactor));
        completionTime = Math.max(5.5, Number((22.0 - (rawScore / 150) * 14.0).toFixed(2)));
        details = `Navigated course avoiding 8/8 dynamic pillars. Sensing rating: ${(senseScore * 100).toFixed(0)}%.`;
        break;
      }

      case 'detection': {
        const camera = compMap.get('camera');
        const controller = compMap.get('controller');
        const comm = compMap.get('comm_module');
        const ir = compMap.get('ir_sensor');

        const camRating = camera?.capabilities.rating || 0;
        const ctlCompute = controller?.capabilities.computeRateMips || 20;
        const commRating = comm?.capabilities.rating || 20;
        const irRating = ir?.capabilities.rating || 15;

        if (!camera) {
          // Without camera, only crude IR proximity detection is possible (max 35% score)
          const fallback = (irRating / 100) * 0.35;
          rawScore = Math.round(fallback * 150 * compatFactor);
          details = 'No camera installed; fallback IR proximity detection only.';
        } else {
          const visionRatio = (camRating / 100) * 0.50 + (Math.min(ctlCompute, 500) / 500) * 0.30 + (commRating / 100) * 0.10 + (irRating / 100) * 0.10;
          rawScore = Math.min(150, Math.round(visionRatio * 150 * compatFactor));
          details = `Target classification accuracy: ${(visionRatio * 98).toFixed(1)}%. FPS latency: ${Math.round(20 + (camRating / 100) * 40)}fps.`;
        }
        completionTime = Math.max(3.8, Number((18.0 - (rawScore / 150) * 12.0).toFixed(2)));
        break;
      }

      case 'pick_place': {
        const arm = compMap.get('robotic_arm');
        const gripper = compMap.get('gripper');
        const servo = compMap.get('servo_motor');
        const camera = compMap.get('camera');

        const armRating = arm?.capabilities.rating || 0;
        const gripRating = gripper?.capabilities.rating || 0;
        const servoRating = servo?.capabilities.rating || 15;
        const camRating = camera?.capabilities.rating || 10;

        if (!arm && !gripper) {
          rawScore = 0;
          details = 'Missing arm and gripper; manipulation test failed.';
        } else if (!gripper) {
          rawScore = Math.round(((armRating / 100) * 0.4) * 200 * compatFactor);
          details = 'Arm equipped but missing gripper claw. Pushed object instead of grasping.';
        } else {
          const manipRatio = (armRating / 100) * 0.40 + (gripRating / 100) * 0.35 + (servoRating / 100) * 0.15 + (camRating / 100) * 0.10;
          rawScore = Math.min(200, Math.round(manipRatio * 200 * compatFactor));
          details = `Grip torque & payload verification succeeded. Arm precision: ${(manipRatio * 100).toFixed(0)}%.`;
        }
        completionTime = Math.max(6.0, Number((28.0 - (rawScore / 200) * 18.0).toFixed(2)));
        break;
      }

      case 'efficiency': {
        const battery = compMap.get('battery');
        const powerReg = compMap.get('power_regulator');
        const motor = compMap.get('motor');

        const batRating = battery?.capabilities.rating || 40;
        const regRating = powerReg?.capabilities.rating || 15;
        const motorEff = motor?.capabilities.efficiencyPercent || 70;

        const effRatio = (batRating / 100) * 0.40 + (regRating / 100) * 0.35 + (motorEff / 100) * 0.25;
        rawScore = Math.min(100, Math.round(effRatio * 100 * compatFactor));
        completionTime = 30.0;
        details = `Current draw stabilization: ${(effRatio * 100).toFixed(0)}%. Thermal efficiency: 94%.`;
        break;
      }
    }

    return {
      taskId: task.id,
      taskName: task.name,
      score: Math.max(0, Math.min(task.maxScore, rawScore)),
      maxScore: task.maxScore,
      efficiencyRating: Math.round((rawScore / task.maxScore) * 100),
      completionTimeSec: completionTime,
      details,
      status: 'completed'
    };
  }
}
