import { ComponentCategory } from '../types/index.js';

export interface RawLotTemplate {
  id: string;
  title: string;
  category: ComponentCategory;
  description: string;
  specifications: Record<string, string>;
  basePrice: number;
  fairValue: number;
  minIncrement: number;
}

export const RAW_LOTS: RawLotTemplate[] = [
  // ==========================================
  // CONTROLLERS (7 items)
  // ==========================================
  {
    id: "lot-01",
    title: "ESP32",
    category: "controller",
    description: "Dual-core Xtensa 32-bit LX6 with integrated 2.4GHz Wi-Fi and Bluetooth LE.",
    specifications: { "Core": "Xtensa Dual-Core 240MHz", "Wireless": "Wi-Fi + BLE 4.2", "SRAM": "520 KB" },
    basePrice: 5,
    fairValue: 25,
    minIncrement: 1
  },
  {
    id: "lot-02",
    title: "Arduino Uno",
    category: "controller",
    description: "Classic robust ATmega328P microcontroller board for sensory decoding and PWM motor controls.",
    specifications: { "MCU": "ATmega328P 16MHz", "Operating Voltage": "5V", "Digital I/O": "14 (6 PWM)" },
    basePrice: 5,
    fairValue: 22,
    minIncrement: 1
  },
  {
    id: "lot-03",
    title: "Raspberry Pi Pico",
    category: "controller",
    description: "Dual-core ARM Cortex-M0+ RP2040 chip featuring flexible programmable I/O (PIO) blocks.",
    specifications: { "Silicon": "RP2040 Dual ARM Cortex-M0+", "Clock": "133MHz", "Flash": "2MB QSPI" },
    basePrice: 4,
    fairValue: 18,
    minIncrement: 1
  },
  {
    id: "lot-04",
    title: "STM32 ARM Cortex-M4",
    category: "controller",
    description: "High-performance Black Pill microcontroller with hardware floating-point unit and DSP instructions.",
    specifications: { "Core": "ARM Cortex-M4 100MHz", "FPU": "Single-Precision", "DMA": "16-Stream" },
    basePrice: 6,
    fairValue: 26,
    minIncrement: 1
  },
  {
    id: "lot-05",
    title: "Teensy 4.1 High-Speed MCU",
    category: "controller",
    description: "600 MHz ARM Cortex-M7 beast for complex real-time kinematics and multi-sensor telemetry.",
    specifications: { "Clock": "600MHz Cortex-M7", "RAM": "1024K", "Ethernet": "10/100 DP83825" },
    basePrice: 7,
    fairValue: 30,
    minIncrement: 1
  },
  {
    id: "lot-06",
    title: "BeagleBone Black Industrial",
    category: "controller",
    description: "Embedded Linux development unit featuring dual 200MHz PRU real-time coprocessors.",
    specifications: { "Processor": "AM335x 1GHz Cortex-A8", "PRU": "Dual 32-bit 200MHz", "OS": "Debian Linux" },
    basePrice: 8,
    fairValue: 35,
    minIncrement: 1
  },
  {
    id: "lot-07",
    title: "NVIDIA Jetson Nano Orin",
    category: "controller",
    description: "Edge AI accelerator board providing 40 TOPS of deep-learning inference for vision and navigation.",
    specifications: { "AI Performance": "40 TOPS", "GPU": "Ampere 1024-Core", "Memory": "8GB LPDDR5" },
    basePrice: 12,
    fairValue: 50,
    minIncrement: 2
  },

  // ==========================================
  // MOTORS & ACTUATORS (7 items)
  // ==========================================
  {
    id: "lot-08",
    title: "High-Torque DC Motor",
    category: "motor",
    description: "12V brushed DC motor with metal spur gearing delivering strong low-end torque for heavy payloads.",
    specifications: { "Voltage": "12V DC", "Stall Torque": "18 kg-cm", "RPM": "300 RPM" },
    basePrice: 3,
    fairValue: 15,
    minIncrement: 1
  },
  {
    id: "lot-09",
    title: "Servo Motor",
    category: "motor",
    description: "Precision metal gear standard servo with 180-degree rotation for steering and joint articulation.",
    specifications: { "Gear Type": "Copper & Steel", "Speed": "0.14 sec/60°", "Torque": "12 kg-cm" },
    basePrice: 2,
    fairValue: 10,
    minIncrement: 1
  },
  {
    id: "lot-10",
    title: "Stepper Motor",
    category: "motor",
    description: "NEMA 17 high-precision bipolar stepper motor with 1.8 degree step angle for robotic positioning.",
    specifications: { "Step Angle": "1.8°", "Holding Torque": "45 N-cm", "Rated Current": "1.5A" },
    basePrice: 4,
    fairValue: 18,
    minIncrement: 1
  },
  {
    id: "lot-11",
    title: "Gearbox",
    category: "motor",
    description: "Epicyclic all-metal planetary reduction gearbox with 20:1 ratio for maximum drive shaft torque.",
    specifications: { "Ratio": "20:1", "Efficiency": "94%", "Backlash": "< 25 arc-min" },
    basePrice: 4,
    fairValue: 16,
    minIncrement: 1
  },
  {
    id: "lot-12",
    title: "Brushless BLDC Outrunner Motor",
    category: "motor",
    description: "High-efficiency brushless outrunner motor rated for high RPM propulsion and flywheel systems.",
    specifications: { "KV": "1400 KV", "Peak Power": "350W", "Poles": "14-Pole Magnet" },
    basePrice: 5,
    fairValue: 22,
    minIncrement: 1
  },
  {
    id: "lot-13",
    title: "Coreless Linear Actuator 50mm",
    category: "motor",
    description: "Compact 50mm stroke electric linear actuator with internal limit switches and ball-screw drive.",
    specifications: { "Stroke": "50mm", "Max Thrust": "150N", "Speed": "15 mm/s" },
    basePrice: 4,
    fairValue: 19,
    minIncrement: 1
  },
  {
    id: "lot-14",
    title: "Dual H-Bridge Motor Driver ESC",
    category: "motor",
    description: "Opto-isolated dual MOSFET speed controller supporting up to 30A continuous motor current.",
    specifications: { "Peak Current": "30A Dual", "Logic Input": "3.3V / 5V PWM", "Protection": "Thermal + OCP" },
    basePrice: 3,
    fairValue: 14,
    minIncrement: 1
  },

  // ==========================================
  // SENSORS (7 items)
  // ==========================================
  {
    id: "lot-15",
    title: "Ultrasonic Sensor",
    category: "sensor",
    description: "Non-contact sonar ranging module offering 2cm to 400cm precision distance measurement.",
    specifications: { "Range": "2cm - 400cm", "Accuracy": "3mm", "Trigger Input": "10us TTL" },
    basePrice: 2,
    fairValue: 9,
    minIncrement: 1
  },
  {
    id: "lot-16",
    title: "IR Sensor",
    category: "sensor",
    description: "Fast-response reflective infrared transceiver pair for high-speed line tracing and edge detection.",
    specifications: { "Detection Distance": "1mm - 25mm", "Response": "< 10 us", "Output": "Analog & Digital" },
    basePrice: 1,
    fairValue: 5,
    minIncrement: 1
  },
  {
    id: "lot-17",
    title: "IMU / Gyroscope",
    category: "sensor",
    description: "6-axis motion tracking module combining a 3-axis gyroscope and 3-axis accelerometer with DMP.",
    specifications: { "Gyro Range": "±2000 °/s", "Accel Range": "±16g", "Interface": "I2C 400kHz" },
    basePrice: 5,
    fairValue: 20,
    minIncrement: 1
  },
  {
    id: "lot-18",
    title: "Camera Module",
    category: "sensor",
    description: "5-Megapixel optical sensor with 120-degree wide-angle lens for object tracking and OpenCV vision.",
    specifications: { "Resolution": "5MP 1080p@30fps", "FOV": "120° Fisheye", "Interface": "MIPI CSI-2" },
    basePrice: 6,
    fairValue: 28,
    minIncrement: 1
  },
  {
    id: "lot-19",
    title: "VL53L1X ToF Laser Ranging Sensor",
    category: "sensor",
    description: "FlightSense Time-of-Flight laser rangefinder with millimeter precision independent of surface color.",
    specifications: { "Max Range": "4 meters", "Wavelength": "940nm Class 1", "Rate": "50 Hz" },
    basePrice: 4,
    fairValue: 18,
    minIncrement: 1
  },
  {
    id: "lot-20",
    title: "Magnetic Hall Effect Encoder Pair",
    category: "sensor",
    description: "Dual-channel quadrature magnetic wheel encoders for precise sub-millimeter odometry feedback.",
    specifications: { "PPR": "1024 Pulses/Rev", "Channels": "A / B Quadrature", "Magnet": "Neodymium Ring" },
    basePrice: 3,
    fairValue: 14,
    minIncrement: 1
  },
  {
    id: "lot-21",
    title: "2D 360° LiDAR Scanner",
    category: "sensor",
    description: "360-degree laser triangulation scanner streaming 8000 distance samples/second for 2D SLAM mapping.",
    specifications: { "Scan Radius": "12 meters", "Sample Rate": "8 kHz", "Frequency": "10 Hz Rotational" },
    basePrice: 10,
    fairValue: 45,
    minIncrement: 2
  },

  // ==========================================
  // POWER & ENERGY (7 items)
  // ==========================================
  {
    id: "lot-22",
    title: "Battery Pack",
    category: "power",
    description: "11.1V 3S 2200mAh 35C high-discharge lithium polymer battery pack with XT60 connector.",
    specifications: { "Chemistry": "LiPo 3S", "Capacity": "2200mAh", "Discharge": "35C Continuous" },
    basePrice: 5,
    fairValue: 20,
    minIncrement: 1
  },
  {
    id: "lot-23",
    title: "Solar Panel",
    category: "power",
    description: "Monocrystalline lightweight solar harvesting panel with integrated anti-reflective coating.",
    specifications: { "Peak Output": "10W 18V", "Cell Efficiency": "22.4%", "Substrate": "ETFE Flexible" },
    basePrice: 6,
    fairValue: 24,
    minIncrement: 1
  },
  {
    id: "lot-24",
    title: "Voltage Regulator",
    category: "power",
    description: "High-efficiency buck-boost synchronous DC-DC regulator delivering clean 5V/12V rails.",
    specifications: { "Input": "4V - 32V", "Output": "5V / 12V 5A", "Efficiency": "96%" },
    basePrice: 2,
    fairValue: 8,
    minIncrement: 1
  },
  {
    id: "lot-25",
    title: "Smart BMS Battery Management Module",
    category: "power",
    description: "Multi-cell protection board with cell balancing, over-temperature cutoff, and I2C fuel-gauge stats.",
    specifications: { "Balance Current": "100mA", "Cutoff Voltage": "4.25V / 2.8V", "Telemetry": "I2C Bus" },
    basePrice: 3,
    fairValue: 15,
    minIncrement: 1
  },
  {
    id: "lot-26",
    title: "Ultra-Capacitor Peak Surge Bank",
    category: "power",
    description: "50F supercapacitor buffer module absorbing motor stall spikes and shielding primary controller rails.",
    specifications: { "Capacitance": "50 Farads", "ESR": "< 12 mOhm", "Voltage Limit": "16V" },
    basePrice: 4,
    fairValue: 18,
    minIncrement: 1
  },
  {
    id: "lot-27",
    title: "Hot-Swap Dual Battery Power Switcher",
    category: "power",
    description: "Ideal-diode power path selector allowing seamless on-the-fly battery swaps with zero reboot.",
    specifications: { "Inputs": "Dual 2S-6S", "Switch Time": "0 ms (Seamless)", "Max Load": "40A" },
    basePrice: 3,
    fairValue: 12,
    minIncrement: 1
  },
  {
    id: "lot-28",
    title: "High-Current Power Distribution Board",
    category: "power",
    description: "Heavy copper 4-layer power distribution hub with LC filtered video and auxiliary 5V/9V outputs.",
    specifications: { "Main Rail": "120A Continuous", "Aux Rails": "5V@3A + 9V@2A", "Copper": "4oz Heavy" },
    basePrice: 4,
    fairValue: 16,
    minIncrement: 1
  },

  // ==========================================
  // STRUCTURAL & CHASSIS (7 items)
  // ==========================================
  {
    id: "lot-29",
    title: "Wheel Set",
    category: "structural",
    description: "Four-piece heavy-duty rubberized drive wheels with brass hubs and aggressive high-grip treads.",
    specifications: { "Diameter": "65mm", "Hub": "4mm Hex Brass", "Tread": "High-Traction Silicone" },
    basePrice: 3,
    fairValue: 12,
    minIncrement: 1
  },
  {
    id: "lot-30",
    title: "Chassis Kit",
    category: "structural",
    description: "Modular laser-cut anodized 6061 aluminum double-deck chassis plate with universal motor mounts.",
    specifications: { "Material": "6061-T6 Aluminum", "Thickness": "2.5mm", "Mounts": "Standard 25mm/37mm" },
    basePrice: 6,
    fairValue: 26,
    minIncrement: 1
  },
  {
    id: "lot-31",
    title: "Mecanum Omnidirectional Wheel Set (4x)",
    category: "structural",
    description: "4-wheel Mecanum set with 45-degree angled rollers enabling instant 360-degree holonomic movement.",
    specifications: { "Rollers": "9 TPU Rollers/Wheel", "Diameter": "80mm", "Load Capacity": "15 kg" },
    basePrice: 5,
    fairValue: 22,
    minIncrement: 1
  },
  {
    id: "lot-32",
    title: "Carbon Fiber Quadruped Leg Assembly",
    category: "structural",
    description: "Ultra-rigid 3K twill carbon fiber articulated leg frame designed for dynamic walking robots.",
    specifications: { "Weave": "3K Matte Carbon", "Bearings": "Dual Shielded Ball", "Weight": "45 grams" },
    basePrice: 5,
    fairValue: 24,
    minIncrement: 1
  },
  {
    id: "lot-33",
    title: "Rubberized All-Terrain Offroad Tracks",
    category: "structural",
    description: "Continuous caterpillar tread system with tensioner sprockets for navigating rough terrain and obstacles.",
    specifications: { "Width": "40mm", "Tension": "Adjustable Idler", "Ground Contact": "180mm" },
    basePrice: 4,
    fairValue: 18,
    minIncrement: 1
  },
  {
    id: "lot-34",
    title: "Titanium-Alloy Servo Bracket Matrix",
    category: "structural",
    description: "CNC machined lightweight U-brackets, multi-function flanges, and L-mounts for robotic arms.",
    specifications: { "Alloy": "Grade 5 Titanium", "Hardware": "M3 High-Tensile Steel", "Pieces": "12-Piece Set" },
    basePrice: 2,
    fairValue: 10,
    minIncrement: 1
  },
  {
    id: "lot-35",
    title: "2-DOF Robotic Gripper Claw & Wrist",
    category: "structural",
    description: "Parallel jaw mechanical manipulator claw with silicone grip pads and wrist servo pivot.",
    specifications: { "Grip Width": "0 - 75mm", "Wrist Pivot": "180° Range", "Grip Force": "14N" },
    basePrice: 5,
    fairValue: 21,
    minIncrement: 1
  },
  {
    id: "lot-36",
    title: "Omnidirectional Mecanum Wheel Chassis Set",
    category: "structural",
    description: "Four-wheel 45° angled roller drive set enabling holonomic omnidirectional movement across arena floors.",
    specifications: { "Rollers": "9 Rubberized TPU", "Bearing": "Dual Ball Bearing", "Load": "15kg / Wheel" },
    basePrice: 5,
    fairValue: 24,
    minIncrement: 1
  }
];
