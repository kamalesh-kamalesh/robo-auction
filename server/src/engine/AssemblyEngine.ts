import {
  AssemblyState,
  AssemblySlot,
  MajorComponentCategory,
  PurchasedComponent,
  Team
} from '../types/index.js';

export class AssemblyEngine {
  public static readonly ALL_CATEGORIES: MajorComponentCategory[] = [
    'chassis',
    'motor',
    'motor_driver',
    'battery',
    'controller',
    'ultrasonic_sensor',
    'ir_sensor',
    'line_sensor',
    'servo_motor',
    'wheel_set',
    'gearbox',
    'encoder',
    'camera',
    'comm_module',
    'gripper',
    'robotic_arm',
    'power_regulator',
    'imu',
    'distance_sensor',
    'control_interface'
  ];

  /**
   * Initializes a clean assembly state for a team
   */
  public static createInitialState(): AssemblyState {
    const slots = {} as Record<MajorComponentCategory, AssemblySlot>;
    for (const cat of this.ALL_CATEGORIES) {
      slots[cat] = {
        category: cat,
        categoryName: this.getCategoryLabel(cat),
        assignedVariantId: null,
        assignedComponent: null,
        installed: false
      };
    }

    return {
      slots,
      connected: false,
      isValidated: false,
      compatibilityScore: 0,
      errors: [],
      warnings: []
    };
  }

  /**
   * Auto-assigns or updates components in a team's assembly based on their purchased components
   */
  public static syncPurchasedComponents(team: Team): AssemblyState {
    const assembly = team.assembly || this.createInitialState();

    // Map purchased components by category
    const byCategory = new Map<MajorComponentCategory, PurchasedComponent>();
    for (const comp of team.components) {
      byCategory.set(comp.category, comp);
    }

    // Populate each slot
    for (const cat of this.ALL_CATEGORIES) {
      const purchased = byCategory.get(cat);
      if (purchased) {
        assembly.slots[cat] = {
          category: cat,
          categoryName: this.getCategoryLabel(cat),
          assignedVariantId: purchased.variantId,
          assignedComponent: purchased,
          installed: true
        };
      } else {
        assembly.slots[cat] = {
          category: cat,
          categoryName: this.getCategoryLabel(cat),
          assignedVariantId: null,
          assignedComponent: null,
          installed: false
        };
      }
    }

    return this.validateAssembly(assembly);
  }

  /**
   * Validates component compatibility and rules
   */
  public static validateAssembly(assembly: AssemblyState): AssemblyState {
    const errors: string[] = [];
    const warnings: string[] = [];
    let compatibilityScore = 100;

    const slots = assembly.slots;
    const motor = slots.motor?.assignedComponent;
    const motorDriver = slots.motor_driver?.assignedComponent;
    const battery = slots.battery?.assignedComponent;
    const controller = slots.controller?.assignedComponent;
    const chassis = slots.chassis?.assignedComponent;
    const camera = slots.camera?.assignedComponent;
    const arm = slots.robotic_arm?.assignedComponent;
    const gripper = slots.gripper?.assignedComponent;
    const servo = slots.servo_motor?.assignedComponent;
    const powerReg = slots.power_regulator?.assignedComponent;

    // Rule 1: Essential Core Components Check
    if (!chassis) {
      errors.push('CRITICAL: Chassis is missing. Robot has no structural frame.');
      compatibilityScore -= 30;
    }
    if (!controller) {
      errors.push('CRITICAL: Controller is missing. Robot has no processing brain.');
      compatibilityScore -= 30;
    }
    if (!battery) {
      errors.push('CRITICAL: Battery is missing. Robot has no power source.');
      compatibilityScore -= 30;
    }
    if (!motor) {
      warnings.push('WARNING: Motor is missing. Robot will have zero mobile drive.');
      compatibilityScore -= 15;
    }

    // Rule 2: Motor Driver + Motor Compatibility
    if (motor && !motorDriver) {
      errors.push('INCOMPATIBILITY: Motor requires a Motor Driver to operate.');
      compatibilityScore -= 20;
    } else if (motor && motorDriver) {
      const motorWatts = motor.capabilities.powerWatts || 100;
      const driverTier = motorDriver.variantTier;

      if (motor.variantTier === 'pro' && driverTier === 'basic') {
        errors.push(
          'INCOMPATIBILITY: Pro Motor (220W) exceeds Basic Motor Driver current capacity (10A max). Driver will overheat or shut down.'
        );
        compatibilityScore -= 25;
      } else if (motor.variantTier === 'advanced' && driverTier === 'basic') {
        warnings.push(
          'SUBOPTIMAL: Advanced Motor (150W) with Basic Driver operates at 80% throttle limit.'
        );
        compatibilityScore -= 10;
      }
    }

    // Rule 3: Battery & Power Draw
    if (battery) {
      const batteryMah = battery.capabilities.capacityMah || 2000;
      const totalPowerWatts =
        (motor?.capabilities.powerWatts || 0) +
        (arm ? 60 : 0) +
        (controller?.capabilities.computeRateMips ? 20 : 10);

      if (batteryMah < 3000 && totalPowerWatts > 250) {
        warnings.push(
          `POWER STRESS: High power consumption (${totalPowerWatts}W) on ${batteryMah}mAh battery causes rapid voltage sag.`
        );
        compatibilityScore -= 12;
      }

      if (!powerReg && totalPowerWatts > 180) {
        warnings.push(
          'VOLTAGE RIPPLE: Missing Power Regulation Module. Sensors and camera subject to motor bus noise.'
        );
        compatibilityScore -= 8;
      }
    }

    // Rule 4: Controller Bus & Sensor / Vision IO
    if (controller) {
      const compute = controller.capabilities.computeRateMips || 50;
      if (camera && compute < 100 && controller.variantTier === 'basic') {
        warnings.push(
          'LATENCY BOTTLENECK: Basic Microcontroller lacks CSI bus/high MIPS for real-time video processing.'
        );
        compatibilityScore -= 15;
      }
    }

    // Rule 5: Arm + Gripper Synergies
    if (gripper && !arm) {
      warnings.push(
        'MOUNT WARNING: Gripper installed without Robotic Arm. Manipulation reach is limited to ground level.'
      );
      compatibilityScore -= 8;
    }
    if (arm && !servo) {
      warnings.push(
        'ARTICULATION DEFICIT: Robotic Arm installed without high-precision Servo Motor. Arm joints will lack fine articulation.'
      );
      compatibilityScore -= 10;
    }

    // Rule 6: Chassis Payload Check
    if (chassis) {
      const payloadLimitKg = chassis.capabilities.payloadKg || 5;
      // Estimate total weight
      let estWeightKg = 1.0; // base weight
      for (const slot of Object.values(slots)) {
        if (slot.installed) estWeightKg += 0.35;
      }
      if (estWeightKg > payloadLimitKg) {
        warnings.push(
          `WEIGHT WARNING: Total component weight (~${estWeightKg.toFixed(1)}kg) exceeds chassis max payload (${payloadLimitKg}kg). Mobility impacted.`
        );
        compatibilityScore -= 12;
      }
    }

    compatibilityScore = Math.max(10, Math.min(100, compatibilityScore));
    const isValidated = errors.length === 0 && chassis !== undefined && controller !== undefined && battery !== undefined;

    return {
      slots,
      connected: isValidated,
      isValidated,
      compatibilityScore,
      errors,
      warnings,
      lastValidatedAt: Date.now()
    };
  }

  public static getCategoryLabel(cat: MajorComponentCategory): string {
    const labels: Record<MajorComponentCategory, string> = {
      chassis: 'Chassis Frame',
      motor: 'Drive Motor',
      motor_driver: 'Motor Driver',
      battery: 'Power Battery',
      controller: 'Main Controller',
      ultrasonic_sensor: 'Ultrasonic Sensor',
      ir_sensor: 'Infrared Sensor',
      line_sensor: 'Line Sensor Array',
      servo_motor: 'Servo Actuator',
      wheel_set: 'Wheel & Traction Set',
      gearbox: 'Transmission Gearbox',
      encoder: 'Optical Wheel Encoder',
      camera: 'Vision Camera',
      comm_module: 'Communication Module',
      gripper: 'Robotic Gripper',
      robotic_arm: 'Articulated Arm',
      power_regulator: 'Power Regulator (DC-DC)',
      imu: 'IMU Gyro / Accelerometer',
      distance_sensor: 'LiDAR / Distance Sensor',
      control_interface: 'Control Telemetry Module'
    };
    return labels[cat] || cat;
  }
}
