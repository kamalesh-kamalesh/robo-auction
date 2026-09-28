import { MajorComponentCategory, RobotComponent, ComponentVariant } from '../types/index.js';

export interface RawComponentDef {
  id: string;
  order: number;
  name: string;
  category: MajorComponentCategory;
  description: string;
  variants: [
    Omit<ComponentVariant, 'highestBidderTeamId' | 'highestBidderTeamName' | 'status' | 'currentBid'>,
    Omit<ComponentVariant, 'highestBidderTeamId' | 'highestBidderTeamName' | 'status' | 'currentBid'>,
    Omit<ComponentVariant, 'highestBidderTeamId' | 'highestBidderTeamName' | 'status' | 'currentBid'>
  ];
}

export const ROBOT_COMPONENTS_POOL: RawComponentDef[] = [
  // 1. Chassis
  {
    id: "comp-01",
    order: 1,
    name: "Chassis",
    category: "chassis",
    description: "Structural backbone and platform for all onboard subsystems, motors, and payloads.",
    variants: [
      {
        id: "comp-01-basic",
        componentId: "comp-01",
        componentName: "Chassis",
        category: "chassis",
        name: "Chassis — Basic (Acrylic Flatbed)",
        tier: "basic",
        startingPrice: 3000,
        minIncrement: 500,
        capabilities: { payloadKg: 4, rating: 50 },
        specifications: { "Material": "Laser-Cut Acrylic", "Max Payload": "4.0 kg", "Weight": "650 g", "Mounts": "Standard 3mm Grid" },
        pros: ["Low cost", "Lightweight frame"],
        cons: ["Prone to cracking under heavy collision", "Limited payload"],
        bestFor: "Agile speed sprints and budget conservation"
      },
      {
        id: "comp-01-advanced",
        componentId: "comp-01",
        componentName: "Chassis",
        category: "chassis",
        name: "Chassis — Advanced (6061-T6 Aluminum)",
        tier: "advanced",
        startingPrice: 6500,
        minIncrement: 500,
        capabilities: { payloadKg: 10, rating: 78 },
        specifications: { "Material": "Anodized 6061 Aluminum", "Max Payload": "10.0 kg", "Weight": "1.2 kg", "Mounts": "CNC Slotted Rails" },
        pros: ["High rigidity", "Excellent impact resistance", "Balanced weight"],
        cons: ["Moderate weight increase"],
        bestFor: "All-round multi-terrain competition"
      },
      {
        id: "comp-01-pro",
        componentId: "comp-01",
        componentName: "Chassis",
        category: "chassis",
        name: "Chassis — Pro (Carbon-Titanium Monocoque)",
        tier: "pro",
        startingPrice: 11000,
        minIncrement: 1000,
        capabilities: { payloadKg: 20, rating: 95 },
        specifications: { "Material": "3K Carbon Weave + Titanium Bracing", "Max Payload": "20.0 kg", "Weight": "780 g", "Mounts": "Modular Bay System" },
        pros: ["Ultra-high strength-to-weight", "Extreme payload capacity", "Zero chassis flex"],
        cons: ["High budget investment"],
        bestFor: "Heavy pick & place payloads and maximum obstacle durability"
      }
    ]
  },

  // 2. Motor
  {
    id: "comp-02",
    order: 2,
    name: "Drive Motor",
    category: "motor",
    description: "Core propulsion electric drive units generating locomotion torque and speed.",
    variants: [
      {
        id: "comp-02-basic",
        componentId: "comp-02",
        componentName: "Drive Motor",
        category: "motor",
        name: "Motor — Basic (100W DC Brushed)",
        tier: "basic",
        startingPrice: 4000,
        minIncrement: 500,
        capabilities: { powerWatts: 100, torqueNm: 1.5, speedRpm: 150, efficiencyPercent: 70, rating: 52 },
        specifications: { "Power": "100W", "Torque": "1.5 Nm", "Speed": "150 RPM", "Efficiency": "70%" },
        pros: ["Economical", "Simple 2-wire control"],
        cons: ["Lower torque on steep slopes", "Brush wear"],
        bestFor: "Flat sprint tracks and budget efficiency"
      },
      {
        id: "comp-02-advanced",
        componentId: "comp-02",
        componentName: "Drive Motor",
        category: "motor",
        name: "Motor — Advanced (160W Planetary Gearmotor)",
        tier: "advanced",
        startingPrice: 7500,
        minIncrement: 500,
        capabilities: { powerWatts: 160, torqueNm: 2.8, speedRpm: 210, efficiencyPercent: 82, rating: 78 },
        specifications: { "Power": "160W", "Torque": "2.8 Nm", "Speed": "210 RPM", "Efficiency": "82%" },
        pros: ["Strong climbing torque", "High sustained efficiency", "Steel gears"],
        cons: ["Requires medium-spec motor driver"],
        bestFor: "Obstacle navigation and ramp climbs"
      },
      {
        id: "comp-02-pro",
        componentId: "comp-02",
        componentName: "Drive Motor",
        category: "motor",
        name: "Motor — Pro (250W Brushless Outrunner)",
        tier: "pro",
        startingPrice: 12500,
        minIncrement: 1000,
        capabilities: { powerWatts: 250, torqueNm: 4.2, speedRpm: 320, efficiencyPercent: 92, rating: 96 },
        specifications: { "Power": "250W", "Torque": "4.2 Nm", "Speed": "320 RPM", "Efficiency": "92%" },
        pros: ["Massive acceleration", "Zero brushless friction", "Extreme top speed"],
        cons: ["Requires Pro ESC Driver", "Higher power draw"],
        bestFor: "Maximum speed records and heavy payload hauling"
      }
    ]
  },

  // 3. Motor Driver
  {
    id: "comp-03",
    order: 3,
    name: "Motor Driver",
    category: "motor_driver",
    description: "High-current MOSFET/H-Bridge driver controlling direction, braking, and motor PWM current.",
    variants: [
      {
        id: "comp-03-basic",
        componentId: "comp-03",
        componentName: "Motor Driver",
        category: "motor_driver",
        name: "Motor Driver — Basic (L298N Dual H-Bridge)",
        tier: "basic",
        startingPrice: 2000,
        minIncrement: 500,
        capabilities: { powerWatts: 120, rating: 48 },
        specifications: { "Continuous Current": "2A per channel", "Peak Current": "3A", "Thermal Drop": "2.0V Bipolar" },
        pros: ["Budget friendly", "Universal pin compatibility"],
        cons: ["High heat dissipation", "Cannot drive motors > 120W"],
        bestFor: "Basic motors only"
      },
      {
        id: "comp-03-advanced",
        componentId: "comp-03",
        componentName: "Motor Driver",
        category: "motor_driver",
        name: "Motor Driver — Advanced (Dual VNH5019 MOSFET)",
        tier: "advanced",
        startingPrice: 4500,
        minIncrement: 500,
        capabilities: { powerWatts: 250, rating: 76 },
        specifications: { "Continuous Current": "12A per channel", "Peak Current": "30A", "PWM Frequency": "20 kHz Silent" },
        pros: ["Low RDS(on) resistance", "Current feedback telemetry", "Overheat shutdown"],
        cons: ["Requires 3.3V/5V logic level conversion"],
        bestFor: "Advanced planetary drive motors"
      },
      {
        id: "comp-03-pro",
        componentId: "comp-03",
        componentName: "Motor Driver",
        category: "motor_driver",
        name: "Motor Driver — Pro (Dual FOC BLDC Smart ESC)",
        tier: "pro",
        startingPrice: 8500,
        minIncrement: 500,
        capabilities: { powerWatts: 500, rating: 96 },
        specifications: { "Continuous Current": "30A per channel", "Control": "Field Oriented Control (FOC)", "Bus": "CAN-FD + UART" },
        pros: ["Regenerative braking", "Micro-precision torque vectoring", "Drives any brushless or DC motor"],
        cons: ["Requires CAN bus on controller"],
        bestFor: "Pro motors and maximum energy recovery"
      }
    ]
  },

  // 4. Battery
  {
    id: "comp-04",
    order: 4,
    name: "Battery",
    category: "battery",
    description: "Main energy storage reservoir powering high-drain propulsion and onboard digital circuits.",
    variants: [
      {
        id: "comp-04-basic",
        componentId: "comp-04",
        componentName: "Battery",
        category: "battery",
        name: "Battery — Basic (12V 2200mAh 3S LiPo)",
        tier: "basic",
        startingPrice: 3500,
        minIncrement: 500,
        capabilities: { capacityMah: 2200, voltageVolts: 11.1, efficiencyPercent: 75, rating: 52 },
        specifications: { "Chemistry": "LiPo 3S", "Capacity": "2200 mAh", "Discharge Rate": "20C Constant", "Weight": "190 g" },
        pros: ["Lightweight", "Affordable"],
        cons: ["Short run time under full motor load"],
        bestFor: "Short speed test trials"
      },
      {
        id: "comp-04-advanced",
        componentId: "comp-04",
        componentName: "Battery",
        category: "battery",
        name: "Battery — Advanced (14.8V 4500mAh 4S LiFePO4)",
        tier: "advanced",
        startingPrice: 6800,
        minIncrement: 500,
        capabilities: { capacityMah: 4500, voltageVolts: 14.8, efficiencyPercent: 88, rating: 80 },
        specifications: { "Chemistry": "LiFePO4 4S", "Capacity": "4500 mAh", "Discharge Rate": "35C Constant", "Weight": "380 g" },
        pros: ["High safety", "Stable voltage plateau", "Extended endurance"],
        cons: ["Medium weight penalty"],
        bestFor: "Multi-task endurance and sustained power"
      },
      {
        id: "comp-04-pro",
        componentId: "comp-04",
        componentName: "Battery",
        category: "battery",
        name: "Battery — Pro (22.2V 6000mAh Solid-State Pack)",
        tier: "pro",
        startingPrice: 11500,
        minIncrement: 1000,
        capabilities: { capacityMah: 6000, voltageVolts: 22.2, efficiencyPercent: 96, rating: 97 },
        specifications: { "Chemistry": "Solid-State Electrolyte", "Capacity": "6000 mAh", "Discharge Rate": "60C Burst", "Weight": "320 g" },
        pros: ["Extreme power density", "Zero voltage sag under peak bursts", "Maximum efficiency"],
        cons: ["High price point"],
        bestFor: "Pro motors and maximum energy efficiency scores"
      }
    ]
  },

  // 5. Controller
  {
    id: "comp-05",
    order: 5,
    name: "Controller",
    category: "controller",
    description: "Central processing unit executing autonomy loops, sensor fusion, and actuator kinematics.",
    variants: [
      {
        id: "comp-05-basic",
        componentId: "comp-05",
        componentName: "Controller",
        category: "controller",
        name: "Controller — Basic (ATmega328P 16MHz)",
        tier: "basic",
        startingPrice: 3000,
        minIncrement: 500,
        capabilities: { computeRateMips: 16, rating: 48 },
        specifications: { "Core": "8-bit AVR @ 16MHz", "Flash": "32 KB", "SRAM": "2 KB", "I/O": "14 Digital, 6 Analog" },
        pros: ["Ultra-reliable", "Very low power consumption"],
        cons: ["Cannot process camera video", "Limited sensor update rates"],
        bestFor: "Simple line following and obstacle stopping"
      },
      {
        id: "comp-05-advanced",
        componentId: "comp-05",
        componentName: "Controller",
        category: "controller",
        name: "Controller — Advanced (ESP32-S3 Dual-Core 240MHz)",
        tier: "advanced",
        startingPrice: 5500,
        minIncrement: 500,
        capabilities: { computeRateMips: 600, rating: 80 },
        specifications: { "Core": "Xtensa 32-bit Dual-Core 240MHz", "Vector Unit": "Neural Acceleration", "SRAM": "512 KB + 8MB PSRAM", "Wireless": "Wi-Fi + BLE 5.0" },
        pros: ["Fast sensor fusion", "Built-in hardware vector instructions", "Camera port"],
        cons: ["Higher idle power than 8-bit"],
        bestFor: "Multi-sensor fusion and real-time obstacle avoidance"
      },
      {
        id: "comp-05-pro",
        componentId: "comp-05",
        componentName: "Controller",
        category: "controller",
        name: "Controller — Pro (Raspberry Pi 5 + Hailo AI NPU)",
        tier: "pro",
        startingPrice: 12000,
        minIncrement: 1000,
        capabilities: { computeRateMips: 4000, rating: 98 },
        specifications: { "CPU": "Quad-core Cortex-A76 2.4GHz", "NPU": "Hailo-8L 13 TOPS", "RAM": "8GB LPDDR4X", "OS": "Real-Time Linux" },
        pros: ["Real-time 60fps object detection", "Instantaneous path planning", "Unlimited telemetry"],
        cons: ["Requires 5V 5A power rail", "Higher boot time"],
        bestFor: "Object detection, pick & place vision, and maximum task accuracy"
      }
    ]
  },

  // 6. Ultrasonic Sensor
  {
    id: "comp-06",
    order: 6,
    name: "Ultrasonic Sensor",
    category: "ultrasonic_sensor",
    description: "Sonar pulse ranging sensor detecting distance to large acoustic reflective barriers.",
    variants: [
      {
        id: "comp-06-basic",
        componentId: "comp-06",
        componentName: "Ultrasonic Sensor",
        category: "ultrasonic_sensor",
        name: "Ultrasonic — Basic (HC-SR04 Transducer)",
        tier: "basic",
        startingPrice: 1500,
        minIncrement: 500,
        capabilities: { detectionRangeMeters: 3.0, accuracyPercent: 65, rating: 50 },
        specifications: { "Range": "2cm - 300cm", "Beam Angle": "15 degrees", "Sample Rate": "20 Hz" },
        pros: ["Inexpensive", "Simple echo timing"],
        cons: ["Acoustic blind spot on soft fabrics", "Slow ping rate"],
        bestFor: "Basic wall stopping"
      },
      {
        id: "comp-06-advanced",
        componentId: "comp-06",
        componentName: "Ultrasonic Sensor",
        category: "ultrasonic_sensor",
        name: "Ultrasonic — Advanced (MaxBotix I2C Weatherproof)",
        tier: "advanced",
        startingPrice: 3200,
        minIncrement: 500,
        capabilities: { detectionRangeMeters: 5.0, accuracyPercent: 84, rating: 78 },
        specifications: { "Range": "10cm - 500cm", "Resolution": "1 mm", "Sample Rate": "50 Hz", "Interface": "I2C Bus" },
        pros: ["Direct millimeter I2C readout", "Noise filter DSP", "Zero false echoes"],
        cons: ["Moderate price"],
        bestFor: "Reliable perimeter obstacle detection"
      },
      {
        id: "comp-06-pro",
        componentId: "comp-06",
        componentName: "Ultrasonic Sensor",
        category: "ultrasonic_sensor",
        name: "Ultrasonic — Pro (Phased Array 360 Sonar Dome)",
        tier: "pro",
        startingPrice: 6000,
        minIncrement: 500,
        capabilities: { detectionRangeMeters: 8.0, accuracyPercent: 95, rating: 94 },
        specifications: { "Range": "5cm - 800cm", "Coverage": "360-degree Beamforming", "Sample Rate": "120 Hz" },
        pros: ["Detects objects in all horizontal directions simultaneously", "Instant reaction"],
        cons: ["Requires high controller bus bandwidth"],
        bestFor: "Complex maze and crowded obstacle avoidance"
      }
    ]
  },

  // 7. IR Sensor
  {
    id: "comp-07",
    order: 7,
    name: "IR Sensor Array",
    category: "ir_sensor",
    description: "Infrared proximity detectors providing microsecond close-proximity warning triggers.",
    variants: [
      {
        id: "comp-07-basic",
        componentId: "comp-07",
        componentName: "IR Sensor Array",
        category: "ir_sensor",
        name: "IR Sensor — Basic (Single Beam Analog Opto)",
        tier: "basic",
        startingPrice: 1200,
        minIncrement: 500,
        capabilities: { detectionRangeMeters: 0.3, accuracyPercent: 60, rating: 48 },
        specifications: { "Range": "2cm - 30cm", "Response Time": "10 ms", "Output": "Analog Comparator" },
        pros: ["Pocket-friendly price", "Instant binary trigger"],
        cons: ["Sensitive to ambient sunlight"],
        bestFor: "Bumper threshold safety"
      },
      {
        id: "comp-07-advanced",
        componentId: "comp-07",
        componentName: "IR Sensor Array",
        category: "ir_sensor",
        name: "IR Sensor — Advanced (Modulated 4-Zone Sharp Sensor)",
        tier: "advanced",
        startingPrice: 2800,
        minIncrement: 500,
        capabilities: { detectionRangeMeters: 0.8, accuracyPercent: 82, rating: 76 },
        specifications: { "Range": "4cm - 80cm", "Modulation": "38 kHz Carrier", "Output": "Calibrated Voltage vs Distance" },
        pros: ["Immune to sunlight interference", "Linear distance feedback"],
        cons: ["Narrow optical beam"],
        bestFor: "Close-range corridor centering"
      },
      {
        id: "comp-07-pro",
        componentId: "comp-07",
        componentName: "IR Sensor Array",
        category: "ir_sensor",
        name: "IR Sensor — Pro (8-Channel Optical ToF IR Matrix)",
        tier: "pro",
        startingPrice: 5500,
        minIncrement: 500,
        capabilities: { detectionRangeMeters: 2.0, accuracyPercent: 96, rating: 95 },
        specifications: { "Range": "1cm - 200cm", "Channels": "8 Discrete Time-of-Flight Zones", "Rate": "100 Hz" },
        pros: ["Precise distance matrix map", "Zero surface color bias"],
        cons: ["Higher processor parsing overhead"],
        bestFor: "High-speed cornering and obstacle slalom"
      }
    ]
  },

  // 8. Line Sensor
  {
    id: "comp-08",
    order: 8,
    name: "Line Following Sensor",
    category: "line_sensor",
    description: "Downward-facing reflective optical array for high-speed line tracking and track boundary guidance.",
    variants: [
      {
        id: "comp-08-basic",
        componentId: "comp-08",
        componentName: "Line Following Sensor",
        category: "line_sensor",
        name: "Line Sensor — Basic (3-Channel TCRT5000 Bar)",
        tier: "basic",
        startingPrice: 1400,
        minIncrement: 500,
        capabilities: { accuracyPercent: 62, rating: 50 },
        specifications: { "Sensors": "3 IR Phototransistors", "Pitch": "15 mm", "Scan Rate": "100 Hz" },
        pros: ["Easy calibration", "Low pin count"],
        cons: ["Cannot handle sharp 90-degree crossings at high speed"],
        bestFor: "Slow speed line tracks"
      },
      {
        id: "comp-08-advanced",
        componentId: "comp-08",
        componentName: "Line Following Sensor",
        category: "line_sensor",
        name: "Line Sensor — Advanced (8-Channel QTR-8A Reflectance Array)",
        tier: "advanced",
        startingPrice: 3200,
        minIncrement: 500,
        capabilities: { accuracyPercent: 86, rating: 80 },
        specifications: { "Sensors": "8 Calibrated Phototransistors", "Pitch": "9.5 mm", "Scan Rate": "500 Hz", "Interface": "Analog Multiplexed" },
        pros: ["Sub-millimeter line centering", "Detects junctions & acute curves"],
        cons: ["Requires PID tuning in software"],
        bestFor: "Fast competition line tracking"
      },
      {
        id: "comp-08-pro",
        componentId: "comp-08",
        componentName: "Line Following Sensor",
        category: "line_sensor",
        name: "Line Sensor — Pro (16-Channel High-Speed Optical Matrix)",
        tier: "pro",
        startingPrice: 5800,
        minIncrement: 500,
        capabilities: { accuracyPercent: 98, rating: 97 },
        specifications: { "Sensors": "16 Optical Array", "Scanning": "1,000 Hz Hardware DSP", "Bus": "SPI High-Speed" },
        pros: ["Perfect tracking at speeds > 3 m/s", "Instantaneous curve radius calculation"],
        cons: ["Expensive"],
        bestFor: "Maximum accuracy test score records"
      }
    ]
  },

  // 9. Servo Motor
  {
    id: "comp-09",
    order: 9,
    name: "Servo Motor",
    category: "servo_motor",
    description: "Position-controlled angular actuators for camera pans, steering, and articulated joints.",
    variants: [
      {
        id: "comp-09-basic",
        componentId: "comp-09",
        componentName: "Servo Motor",
        category: "servo_motor",
        name: "Servo — Basic (SG90 Micro Servo 9g)",
        tier: "basic",
        startingPrice: 1500,
        minIncrement: 500,
        capabilities: { torqueNm: 0.25, accuracyPercent: 60, rating: 48 },
        specifications: { "Torque": "0.25 Nm (2.5 kg-cm)", "Gears": "Plastic", "Speed": "0.10s / 60 deg", "Rotation": "180 deg" },
        pros: ["Lightweight (9g)", "Extremely cheap"],
        cons: ["Plastic gears strip easily under shock"],
        bestFor: "Lightweight sensor pans"
      },
      {
        id: "comp-09-advanced",
        componentId: "comp-09",
        componentName: "Servo Motor",
        category: "servo_motor",
        name: "Servo — Advanced (MG996R Metal Gear 15kg-cm)",
        tier: "advanced",
        startingPrice: 3400,
        minIncrement: 500,
        capabilities: { torqueNm: 1.5, accuracyPercent: 82, rating: 78 },
        specifications: { "Torque": "1.5 Nm (15 kg-cm)", "Gears": "Full Brass & Steel", "Speed": "0.14s / 60 deg", "Bearings": "Dual Ball Bearing" },
        pros: ["High holding torque", "Durable metal gear train"],
        cons: ["Higher current spike on stall (2.5A)"],
        bestFor: "Heavy robotic arms and steering racks"
      },
      {
        id: "comp-09-pro",
        componentId: "comp-09",
        componentName: "Servo Motor",
        category: "servo_motor",
        name: "Servo — Pro (Dynamixel Smart Serial Bus Servo)",
        tier: "pro",
        startingPrice: 7200,
        minIncrement: 500,
        capabilities: { torqueNm: 3.8, accuracyPercent: 97, rating: 96 },
        specifications: { "Torque": "3.8 Nm (38 kg-cm)", "Feedback": "12-bit Absolute Magnetic (0.088 deg)", "Motor": "Coreless Brushless", "Control": "Half-Duplex TTL Bus" },
        pros: ["Live position, load & temperature telemetry", "Continuous multi-turn rotation mode", "Zero backlash"],
        cons: ["High cost"],
        bestFor: "Precision pick & place robotic manipulation"
      }
    ]
  },

  // 10. Wheel Set
  {
    id: "comp-10",
    order: 10,
    name: "Wheel Set",
    category: "wheel_set",
    description: "Ground contact friction elements translating axle torque into physical vehicle propulsion.",
    variants: [
      {
        id: "comp-10-basic",
        componentId: "comp-10",
        componentName: "Wheel Set",
        category: "wheel_set",
        name: "Wheel Set — Basic (65mm Rubber Grip Wheels)",
        tier: "basic",
        startingPrice: 1800,
        minIncrement: 500,
        capabilities: { speedRpm: 180, rating: 52 },
        specifications: { "Diameter": "65 mm", "Tread": "Soft Rubber", "Hub": "Plastic D-Shaft" },
        pros: ["Good linear grip", "Low cost"],
        cons: ["Cannot strafe sideways", "Tire slippage on sharp turns"],
        bestFor: "Straight line drag sprints"
      },
      {
        id: "comp-10-advanced",
        componentId: "comp-10",
        componentName: "Wheel Set",
        category: "wheel_set",
        name: "Wheel Set — Advanced (80mm High-Traction All-Terrain)",
        tier: "advanced",
        startingPrice: 3800,
        minIncrement: 500,
        capabilities: { speedRpm: 240, rating: 80 },
        specifications: { "Diameter": "80 mm", "Tread": "Silicone Lugged Tread", "Hub": "Machined Aluminum Hex Hub" },
        pros: ["High obstacle climbing", "Zero rim slippage", "Absorbs drop shocks"],
        cons: ["Slightly higher rolling resistance"],
        bestFor: "Ramp climbs and obstacle courses"
      },
      {
        id: "comp-10-pro",
        componentId: "comp-10",
        componentName: "Wheel Set",
        category: "wheel_set",
        name: "Wheel Set — Pro (100mm Mecanum Omni-Directional 4WD)",
        tier: "pro",
        startingPrice: 7800,
        minIncrement: 500,
        capabilities: { speedRpm: 320, accuracyPercent: 95, rating: 97 },
        specifications: { "Diameter": "100 mm", "Rollers": "12 Ball-Bearing Polyurethane Rollers", "Mobility": "True Holonomic Strafe" },
        pros: ["Strafe sideways instantly without turning chassis", "Ultra-fast agility"],
        cons: ["Requires 4 independent drive motors"],
        bestFor: "Tight obstacle slaloms and rapid object docking"
      }
    ]
  },

  // 11. Gearbox
  {
    id: "comp-11",
    order: 11,
    name: "Gearbox Transmission",
    category: "gearbox",
    description: "Mechanical reduction gearing trading motor RPM for increased axle torque.",
    variants: [
      {
        id: "comp-11-basic",
        componentId: "comp-11",
        componentName: "Gearbox Transmission",
        category: "gearbox",
        name: "Gearbox — Basic (Plastic Spur 1:30)",
        tier: "basic",
        startingPrice: 2000,
        minIncrement: 500,
        capabilities: { torqueNm: 1.2, efficiencyPercent: 68, rating: 50 },
        specifications: { "Ratio": "30:1", "Gears": "Delrin Plastic", "Weight": "120 g" },
        pros: ["Cheap", "Quiet"],
        cons: ["Efficiency losses", "Cannot take high torque bursts"],
        bestFor: "Budget builds"
      },
      {
        id: "comp-11-advanced",
        componentId: "comp-11",
        componentName: "Gearbox Transmission",
        category: "gearbox",
        name: "Gearbox — Advanced (Steel Planetary 1:50)",
        tier: "advanced",
        startingPrice: 4800,
        minIncrement: 500,
        capabilities: { torqueNm: 3.5, efficiencyPercent: 86, rating: 80 },
        specifications: { "Ratio": "50:1", "Gears": "Hardened Chrome-Moly Steel", "Bearing": "Dual Ball Bearings" },
        pros: ["Compact coaxial layout", "Handles up to 10 Nm shock loads", "High efficiency"],
        cons: ["Moderate weight"],
        bestFor: "Ramps and obstacle climbing"
      },
      {
        id: "comp-11-pro",
        componentId: "comp-11",
        componentName: "Gearbox Transmission",
        category: "gearbox",
        name: "Gearbox — Pro (Zero-Backlash Strain Wave Harmonic Drive)",
        tier: "pro",
        startingPrice: 9500,
        minIncrement: 1000,
        capabilities: { torqueNm: 7.0, efficiencyPercent: 94, rating: 98 },
        specifications: { "Ratio": "100:1", "Backlash": "< 0.5 arc-min", "Type": "Elliptical Flexspline" },
        pros: ["Zero mechanical slop", "Astronomical torque output", "Instant direction reversal"],
        cons: ["High investment cost"],
        bestFor: "Robotic arms and sub-millimeter positioning accuracy"
      }
    ]
  },

  // 12. Encoder
  {
    id: "comp-12",
    order: 12,
    name: "Rotary Encoder",
    category: "encoder",
    description: "Wheel odometry feedback device measuring exact wheel rotations for closed-loop motion control.",
    variants: [
      {
        id: "comp-12-basic",
        componentId: "comp-12",
        componentName: "Rotary Encoder",
        category: "encoder",
        name: "Encoder — Basic (Slotted Optical Wheel 20 CPR)",
        tier: "basic",
        startingPrice: 1500,
        minIncrement: 500,
        capabilities: { accuracyPercent: 60, rating: 50 },
        specifications: { "Resolution": "20 Counts Per Revolution", "Type": "Slotted Disc Optocoupler" },
        pros: ["Simple pulse counting", "Low cost"],
        cons: ["Low resolution (approx 10mm per tick)"],
        bestFor: "Basic distance checks"
      },
      {
        id: "comp-12-advanced",
        componentId: "comp-12",
        componentName: "Rotary Encoder",
        category: "encoder",
        name: "Encoder — Advanced (Hall Effect Quadrature 360 CPR)",
        tier: "advanced",
        startingPrice: 3500,
        minIncrement: 500,
        capabilities: { accuracyPercent: 88, rating: 82 },
        specifications: { "Resolution": "360 CPR (1,440 Quadrature Ticks)", "Sensor": "Dual Hall-Effect Magnetic", "Immunity": "Dustproof" },
        pros: ["Detects forward and reverse rotation", "Immune to dust and arena dirt"],
        cons: ["Requires hardware timer interrupts"],
        bestFor: "PID velocity loops and precise navigation"
      },
      {
        id: "comp-12-pro",
        componentId: "comp-12",
        componentName: "Rotary Encoder",
        category: "encoder",
        name: "Encoder — Pro (14-Bit Magnetic Absolute Encoder 16384 CPR)",
        tier: "pro",
        startingPrice: 6500,
        minIncrement: 500,
        capabilities: { accuracyPercent: 99, rating: 98 },
        specifications: { "Resolution": "16,384 Counts Per Revolution (14-bit)", "Output": "High-Speed SSI / SPI", "Absolute": "Never loses position on power cut" },
        pros: ["True zero-drift position tracking", "Sub-millimeter dead-reckoning"],
        cons: ["Requires high-speed SPI bus on controller"],
        bestFor: "Flawless autonomous accuracy test scoring"
      }
    ]
  },

  // 13. Camera
  {
    id: "comp-13",
    order: 13,
    name: "Vision Camera",
    category: "camera",
    description: "Visual imaging sensor for color tracking, visual odometry, and AI target detection.",
    variants: [
      {
        id: "comp-13-basic",
        componentId: "comp-13",
        componentName: "Vision Camera",
        category: "camera",
        name: "Camera — Basic (OV7670 VGA 640x480)",
        tier: "basic",
        startingPrice: 2200,
        minIncrement: 500,
        capabilities: { accuracyPercent: 55, rating: 48 },
        specifications: { "Resolution": "640 x 480 @ 30fps", "Color": "RGB565", "Interface": "Parallel DVP" },
        pros: ["Very low power", "Direct controller buffer"],
        cons: ["Low resolution", "Poor low-light sensitivity"],
        bestFor: "Simple color blob tracking"
      },
      {
        id: "comp-13-advanced",
        componentId: "comp-13",
        componentName: "Vision Camera",
        category: "camera",
        name: "Camera — Advanced (Sony IMX219 8MP 1080p HD)",
        tier: "advanced",
        startingPrice: 4800,
        minIncrement: 500,
        capabilities: { accuracyPercent: 82, rating: 80 },
        specifications: { "Resolution": "1080p @ 60fps / 8 Megapixels", "Sensor": "Sony Exmor R", "Bus": "MIPI-CSI2" },
        pros: ["Crisp edges", "High frame rate", "Low latency"],
        cons: ["Requires CSI camera port on controller"],
        bestFor: "Object detection and target classification"
      },
      {
        id: "comp-13-pro",
        componentId: "comp-13",
        componentName: "Vision Camera",
        category: "camera",
        name: "Camera — Pro (Intel RealSense Stereo Depth 3D Camera)",
        tier: "pro",
        startingPrice: 11500,
        minIncrement: 1000,
        capabilities: { accuracyPercent: 98, rating: 98 },
        specifications: { "Depth Sensor": "Active IR Stereo 1280x720 @ 90fps", "RGB": "Full HD 1080p", "Range": "0.2m - 10m 3D Pointcloud" },
        pros: ["Real-time 3D spatial depth coordinates for robotic arms", "Obstacle volumetric awareness"],
        cons: ["Requires USB 3.0 / Pro Controller"],
        bestFor: "Maximum object detection and pick & place test performance"
      }
    ]
  },

  // 14. Communication Module
  {
    id: "comp-14",
    order: 14,
    name: "Wireless Telemetry Module",
    category: "comm_module",
    description: "Radio frequency datalink sending live robot telemetry and receiving remote control overrides.",
    variants: [
      {
        id: "comp-14-basic",
        componentId: "comp-14",
        componentName: "Wireless Telemetry Module",
        category: "comm_module",
        name: "Comm — Basic (HC-05 Bluetooth 2.0 Module)",
        tier: "basic",
        startingPrice: 1500,
        minIncrement: 500,
        capabilities: { detectionRangeMeters: 10, rating: 50 },
        specifications: { "Protocol": "Bluetooth 2.0+EDR", "Baud Rate": "9600 - 115200 bps", "Range": "10 meters" },
        pros: ["Simple UART serial", "Pair with smartphone"],
        cons: ["Short range", "Susceptible to arena 2.4GHz noise"],
        bestFor: "Basic wireless debug"
      },
      {
        id: "comp-14-advanced",
        componentId: "comp-14",
        componentName: "Wireless Telemetry Module",
        category: "comm_module",
        name: "Comm — Advanced (NRF24L01+ PA/LNA 2.4GHz Datalink)",
        tier: "advanced",
        startingPrice: 3200,
        minIncrement: 500,
        capabilities: { detectionRangeMeters: 250, rating: 78 },
        specifications: { "Frequency": "2.4 GHz ISM", "Data Rate": "2 Mbps", "Range": "250 meters", "Output": "+20 dBm PA" },
        pros: ["Hardware packet auto-acknowledgement", "Long reliable range", "Low latency (< 2ms)"],
        cons: ["Requires dedicated SPI interface"],
        bestFor: "Reliable arena telemetry"
      },
      {
        id: "comp-14-pro",
        componentId: "comp-14",
        componentName: "Wireless Telemetry Module",
        category: "comm_module",
        name: "Comm — Pro (Sub-GHz LoRa / ExpressLRS Ultra-Low-Latency)",
        tier: "pro",
        startingPrice: 6200,
        minIncrement: 500,
        capabilities: { detectionRangeMeters: 1000, rating: 96 },
        specifications: { "Frequency": "868 / 915 MHz Anti-Jam", "Update Rate": "500 Hz Packet Rate", "Latency": "< 0.8 ms", "Range": "> 1 km" },
        pros: ["Zero packet loss through walls or concrete arena barriers", "Deterministic response"],
        cons: ["High price"],
        bestFor: "Zero lag response time score bonuses"
      }
    ]
  },

  // 15. Gripper
  {
    id: "comp-15",
    order: 15,
    name: "Gripper End-Effector",
    category: "gripper",
    description: "Mechanical grasping terminal attached to the arm to securely hold target test objects.",
    variants: [
      {
        id: "comp-15-basic",
        componentId: "comp-15",
        componentName: "Gripper End-Effector",
        category: "gripper",
        name: "Gripper — Basic (2-Jaw 3D-Printed Claw)",
        tier: "basic",
        startingPrice: 2000,
        minIncrement: 500,
        capabilities: { payloadKg: 0.5, rating: 50 },
        specifications: { "Grip Style": "Parallel Dual-Jaw", "Max Opening": "55 mm", "Material": "PLA / Acrylic", "Payload": "500 g" },
        pros: ["Inexpensive", "Lightweight"],
        cons: ["Low clamping force", "Slippery on polished objects"],
        bestFor: "Lightweight foam cubes"
      },
      {
        id: "comp-15-advanced",
        componentId: "comp-15",
        componentName: "Gripper End-Effector",
        category: "gripper",
        name: "Gripper — Advanced (Aluminum Parallel Padded Gripper)",
        tier: "advanced",
        startingPrice: 4200,
        minIncrement: 500,
        capabilities: { payloadKg: 2.0, rating: 80 },
        specifications: { "Grip Style": "Self-Centering Scissor", "Max Opening": "85 mm", "Pads": "Silicone High-Friction", "Payload": "2.0 kg" },
        pros: ["Firm non-slip grasp", "Metal linkages", "Centering guide"],
        cons: ["Requires high-torque servo"],
        bestFor: "Solid wooden blocks and metal cylinders"
      },
      {
        id: "comp-15-pro",
        componentId: "comp-15",
        componentName: "Gripper End-Effector",
        category: "gripper",
        name: "Gripper — Pro (Vacuum Suction + Adaptive Compliant Claw)",
        tier: "pro",
        startingPrice: 8500,
        minIncrement: 500,
        capabilities: { payloadKg: 5.0, rating: 97 },
        specifications: { "Hybrid": "Venturi Vacuum Cup + Fin-Ray Adaptive Fingers", "Holding Force": "60 N", "Payload": "5.0 kg" },
        pros: ["Conforms to any irregular object shape instantly", "Zero drop rate"],
        cons: ["Requires pneumatic vacuum pump"],
        bestFor: "Maximum Pick & Place test score"
      }
    ]
  },

  // 16. Robotic Arm
  {
    id: "comp-16",
    order: 16,
    name: "Articulated Robotic Arm",
    category: "robotic_arm",
    description: "Multi-axis articulated arm providing positional reach and degrees-of-freedom for manipulation.",
    variants: [
      {
        id: "comp-16-basic",
        componentId: "comp-16",
        componentName: "Articulated Robotic Arm",
        category: "robotic_arm",
        name: "Robotic Arm — Basic (2-DOF Planar Arm)",
        tier: "basic",
        startingPrice: 3500,
        minIncrement: 500,
        capabilities: { dof: 2, payloadKg: 0.6, rating: 50 },
        specifications: { "Degrees of Freedom": "2-DOF (Shoulder + Elbow)", "Reach": "180 mm", "Material": "Laser-Cut Acrylic" },
        pros: ["Affordable", "Easy kinematic calculations"],
        cons: ["Cannot rotate wrist or orient objects vertically"],
        bestFor: "Frontal ground picking only"
      },
      {
        id: "comp-16-advanced",
        componentId: "comp-16",
        componentName: "Articulated Robotic Arm",
        category: "robotic_arm",
        name: "Robotic Arm — Advanced (4-DOF Aluminum Articulated Arm)",
        tier: "advanced",
        startingPrice: 7500,
        minIncrement: 500,
        capabilities: { dof: 4, payloadKg: 2.0, rating: 80 },
        specifications: { "Degrees of Freedom": "4-DOF (Base Turntable + Shoulder + Elbow + Wrist Pitch)", "Reach": "320 mm", "Material": "Black Anodized Aluminum" },
        pros: ["320mm spherical reach", "Picks objects from side or front platforms"],
        cons: ["Requires 4 servo driver channels"],
        bestFor: "Standard competition pick and place racks"
      },
      {
        id: "comp-16-pro",
        componentId: "comp-16",
        componentName: "Articulated Robotic Arm",
        category: "robotic_arm",
        name: "Robotic Arm — Pro (6-DOF Full Dexterity Carbon Arm)",
        tier: "pro",
        startingPrice: 13500,
        minIncrement: 1000,
        capabilities: { dof: 6, payloadKg: 4.5, rating: 98 },
        specifications: { "Degrees of Freedom": "6-DOF Complete Inverse Kinematics", "Reach": "460 mm", "Material": "Carbon Fiber Tubes + CNC Joints", "Payload": "4.5 kg" },
        pros: ["Full 6-axis spatial trajectory execution", "Extreme precision and strength"],
        cons: ["High budget investment"],
        bestFor: "Maximum pick & place points and complex stacking tasks"
      }
    ]
  },

  // 17. Power Regulation Module
  {
    id: "comp-17",
    order: 17,
    name: "Power Regulation Module",
    category: "power_regulator",
    description: "DC-DC buck/boost power conditioner stabilizing voltages for logic cores, sensors, and servos.",
    variants: [
      {
        id: "comp-17-basic",
        componentId: "comp-17",
        componentName: "Power Regulation Module",
        category: "power_regulator",
        name: "Power Regulator — Basic (LM2596 3A Buck Converter)",
        tier: "basic",
        startingPrice: 1500,
        minIncrement: 500,
        capabilities: { efficiencyPercent: 72, rating: 50 },
        specifications: { "Output": "5V @ 3A max", "Efficiency": "72%", "Ripple": "50 mV" },
        pros: ["Low cost", "Simple potentiometer tune"],
        cons: ["Voltage drops under sudden motor stall load"],
        bestFor: "Basic 5V electronics"
      },
      {
        id: "comp-17-advanced",
        componentId: "comp-17",
        componentName: "Power Regulation Module",
        category: "power_regulator",
        name: "Power Regulator — Advanced (Synchronous Dual 5V/12V BEC 8A)",
        tier: "advanced",
        startingPrice: 3400,
        minIncrement: 500,
        capabilities: { efficiencyPercent: 90, rating: 80 },
        specifications: { "Output": "Dual Isolated 5V 5A + 12V 5A", "Efficiency": "90%", "Filtering": "LC Filter Stage" },
        pros: ["Protects digital controller from motor electrical brownouts", "High current"],
        cons: ["Moderate cost"],
        bestFor: "Advanced multi-servo configurations"
      },
      {
        id: "comp-17-pro",
        componentId: "comp-17",
        componentName: "Power Regulation Module",
        category: "power_regulator",
        name: "Power Regulator — Pro (GaN Ultra-Low-Ripple Power Station)",
        tier: "pro",
        startingPrice: 6500,
        minIncrement: 500,
        capabilities: { efficiencyPercent: 97, rating: 97 },
        specifications: { "Technology": "Gallium Nitride (GaN) Switching", "Output": "3.3V, 5V, 12V, 24V Regulated @ 20A Total", "Efficiency": "97%" },
        pros: ["Zero thermal waste", "Immune to electrical noise spikes", "Maximizes energy efficiency points"],
        cons: ["High cost"],
        bestFor: "Maximum Energy Efficiency test scores"
      }
    ]
  },

  // 18. IMU
  {
    id: "comp-18",
    order: 18,
    name: "IMU Inertial Measurement Unit",
    category: "imu",
    description: "6-axis or 9-axis gyroscope, accelerometer, and compass providing vehicle attitude orientation.",
    variants: [
      {
        id: "comp-18-basic",
        componentId: "comp-18",
        componentName: "IMU Inertial Measurement Unit",
        category: "imu",
        name: "IMU — Basic (MPU-6050 6-Axis Gyro/Accel)",
        tier: "basic",
        startingPrice: 1600,
        minIncrement: 500,
        capabilities: { accuracyPercent: 62, rating: 50 },
        specifications: { "Axes": "3-Axis Gyro + 3-Axis Accel", "Interface": "I2C 400kHz", "Drift": "1-2 deg/min" },
        pros: ["Cheap", "Standard open-source libraries"],
        cons: ["Yaw axis slowly drifts over long run times"],
        bestFor: "Basic tip-over and tilt detection"
      },
      {
        id: "comp-18-advanced",
        componentId: "comp-18",
        componentName: "IMU Inertial Measurement Unit",
        category: "imu",
        name: "IMU — Advanced (BNO055 9-Axis Absolute Sensor Fusion)",
        tier: "advanced",
        startingPrice: 3800,
        minIncrement: 500,
        capabilities: { accuracyPercent: 88, rating: 82 },
        specifications: { "Axes": "Gyro + Accel + Magnetometer", "Onboard DSP": "Hardware Kalman Quaternion Filter", "Drift": "0.1 deg/min" },
        pros: ["Outputs direct pitch/roll/yaw Euler angles without CPU load"],
        cons: ["Affected by strong magnetic fields near high-power motors"],
        bestFor: "Accurate path navigation and heading hold"
      },
      {
        id: "comp-18-pro",
        componentId: "comp-18",
        componentName: "IMU Inertial Measurement Unit",
        category: "imu",
        name: "IMU — Pro (Aviation-Grade Dual FOG-Class IMU + Mag Barometer)",
        tier: "pro",
        startingPrice: 7500,
        minIncrement: 500,
        capabilities: { accuracyPercent: 99, rating: 98 },
        specifications: { "Noise": "10 ug/sqrt(Hz)", "Update": "4,000 Hz SPI", "Temp Compensation": "-40C to +85C Factory Calibrated" },
        pros: ["Zero observable drift", "Microsecond balance stabilization on high-speed maneuvers"],
        cons: ["High cost"],
        bestFor: "Speed test stabilization and maximum navigation accuracy"
      }
    ]
  },

  // 19. Distance Sensor
  {
    id: "comp-19",
    order: 19,
    name: "Precision Laser Distance Sensor",
    category: "distance_sensor",
    description: "Optical Time-of-Flight (ToF) laser rangefinder delivering millimeter distance accuracy.",
    variants: [
      {
        id: "comp-19-basic",
        componentId: "comp-19",
        componentName: "Precision Laser Distance Sensor",
        category: "distance_sensor",
        name: "Distance Sensor — Basic (VL53L0X Laser ToF 2m)",
        tier: "basic",
        startingPrice: 1800,
        minIncrement: 500,
        capabilities: { detectionRangeMeters: 2.0, accuracyPercent: 68, rating: 52 },
        specifications: { "Wavelength": "940 nm Invisible VCSEL", "Range": "30 mm - 2000 mm", "Accuracy": "+/- 3%" },
        pros: ["Precise millimeter readings regardless of target color"],
        cons: ["Maximum 2 meter limit", "Reduced range outdoors"],
        bestFor: "Close range docking"
      },
      {
        id: "comp-19-advanced",
        componentId: "comp-19",
        componentName: "Precision Laser Distance Sensor",
        category: "distance_sensor",
        name: "Distance Sensor — Advanced (TFmini Plus Micro LiDAR 12m)",
        tier: "advanced",
        startingPrice: 4200,
        minIncrement: 500,
        capabilities: { detectionRangeMeters: 12.0, accuracyPercent: 88, rating: 82 },
        specifications: { "Range": "0.1m - 12m", "Frequency": "1,000 Hz Single-Point LiDAR", "Enclosure": "IP65 Waterproof" },
        pros: ["1,000 pings per second", "Works up to 12 meters", "High indoor/outdoor immunity"],
        cons: ["Single narrow 2-degree laser beam"],
        bestFor: "Long-range corridor detection and high-speed obstacle braking"
      },
      {
        id: "comp-19-pro",
        componentId: "comp-19",
        componentName: "Precision Laser Distance Sensor",
        category: "distance_sensor",
        name: "Distance Sensor — Pro (360-Degree RPLiDAR A2 16m Array)",
        tier: "pro",
        startingPrice: 9500,
        minIncrement: 1000,
        capabilities: { detectionRangeMeters: 16.0, accuracyPercent: 97, rating: 97 },
        specifications: { "Scan Mode": "360-degree Continuous Rotary LiDAR", "Sample Rate": "8,000 pts/sec", "Range": "0.2m - 16m" },
        pros: ["Instant 2D floor-plan obstacle map", "Flawless obstacle avoidance in any direction"],
        cons: ["Moving optical rotor mechanism"],
        bestFor: "Perfect Obstacle Avoidance test scores"
      }
    ]
  },

  // 20. Control Interface
  {
    id: "comp-20",
    order: 20,
    name: "Control Interface",
    category: "control_interface",
    description: "Pilot input, safety beacon, emergency stop kill switch, and onboard operator diagnostics display.",
    variants: [
      {
        id: "comp-20-basic",
        componentId: "comp-20",
        componentName: "Control Interface",
        category: "control_interface",
        name: "Interface — Basic (Pushbutton + LED Status Panel)",
        tier: "basic",
        startingPrice: 1200,
        minIncrement: 500,
        capabilities: { rating: 50 },
        specifications: { "Inputs": "3 Momentary Tactile Buttons", "Output": "4 Multi-color Status LEDs", "Kill Switch": "Manual Rocker" },
        pros: ["Minimal cost", "Zero software overhead"],
        cons: ["No text or live telemetry readout on robot"],
        bestFor: "Budget-conscious setups"
      },
      {
        id: "comp-20-advanced",
        componentId: "comp-20",
        componentName: "Control Interface",
        category: "control_interface",
        name: "Interface — Advanced (0.96 OLED + E-Stop Mushroom Switch)",
        tier: "advanced",
        startingPrice: 3200,
        minIncrement: 500,
        capabilities: { rating: 80 },
        specifications: { "Display": "128x64 Yellow/Blue I2C OLED", "Safety": "Mil-Spec Push-to-Break E-Stop", "Audio": "Piezo Beeper" },
        pros: ["Displays battery voltage, task state, and sensor debug text", "Instant safety trip"],
        cons: ["OLED requires small CPU refresh loop"],
        bestFor: "Smooth trackside diagnosis and safety clearance"
      },
      {
        id: "comp-20-pro",
        componentId: "comp-20",
        componentName: "Control Interface",
        category: "control_interface",
        name: "Interface — Pro (3.5 Capacitive Touch GUI + Remote Radio E-Stop)",
        tier: "pro",
        startingPrice: 7000,
        minIncrement: 500,
        capabilities: { rating: 97 },
        specifications: { "Display": "3.5-inch 480x320 Capacitive Color Touchscreen", "Safety": "Wireless Dual-Channel Radio E-Stop (Fail-Safe)", "GUI": "Embedded Touch UI" },
        pros: ["Tune PID parameters and test routines directly on robot screen without laptop", "Certified wireless emergency stop"],
        cons: ["High price point"],
        bestFor: "Maximum operational efficiency and safety bonus points"
      }
    ]
  }
];

export function generate20Components(): Record<string, RobotComponent> {
  const map: Record<string, RobotComponent> = {};

  ROBOT_COMPONENTS_POOL.forEach((def, index) => {
    const isFirst = index === 0;
    const variants: [ComponentVariant, ComponentVariant, ComponentVariant] = [
      {
        ...def.variants[0],
        currentBid: def.variants[0].startingPrice,
        highestBidderTeamId: null,
        highestBidderTeamName: null,
        status: 'AVAILABLE'
      },
      {
        ...def.variants[1],
        currentBid: def.variants[1].startingPrice,
        highestBidderTeamId: null,
        highestBidderTeamName: null,
        status: 'AVAILABLE'
      },
      {
        ...def.variants[2],
        currentBid: def.variants[2].startingPrice,
        highestBidderTeamId: null,
        highestBidderTeamName: null,
        status: 'AVAILABLE'
      }
    ];

    map[def.id] = {
      id: def.id,
      order: def.order,
      name: def.name,
      category: def.category,
      description: def.description,
      status: isFirst ? 'open' : 'upcoming',
      variants,
      timeRemainingMs: 60 * 1000,
      timeLeftSeconds: 60,
      extensionsCount: 0,
      maxExtensions: 3
    };
  });

  return map;
}

export const generateRobotComponents = generate20Components;
