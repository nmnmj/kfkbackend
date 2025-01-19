// const SENSOR_TOPIC = 'temperature-sensors';

// const sendSensorData = (temperature) => {
//   const timestamp = new Date().toISOString();

//   producer.produce(
//     SENSOR_TOPIC,
//     null, // Partition, null for automatic
//     Buffer.from(JSON.stringify({ temperature, timestamp })), // Message
//     'sensor1', // Key
//     Date.now() // Timestamp
//   );

//   console.log(`Produced: { temperature: ${temperature}, timestamp: ${timestamp} }`);
// };

// Create an endpoint to send sensor data
// app.post('/send-sensor-data', (req, res) => {
//   const { temperature } = req.body; // Get temperature from request body

//   if (typeof temperature !== 'number') {
//     return res.status(400).json({ message: 'Invalid temperature value. Must be a number.' });
//   }

//   try {
//     sendSensorData(temperature); // Send provided temperature
//     res.status(200).json({ message: 'Sensor data sent successfully' });
//   } catch (error) {
//     console.error('Error sending sensor data:', error);
//     res.status(500).json({ message: 'Failed to send sensor data' });
//   }
// });

// // Create a Read Stream for consuming messages
// const stream = new Kafka.createReadStream(
//   kafkaConsumerConfig,
//   { 'auto.offset.reset': 'beginning' },
//   { topics: [SENSOR_TOPIC] }
// );

// stream.on("data", (message) => {
//   console.log("Received message:", message.value.toString()); // Log raw message

//   try {
//     const sensorData = JSON.parse(message.value.toString());
//     console.log(`Consumed from ${SENSOR_TOPIC}:`, sensorData);

//     // Basic Processing: Add alert if temperature > 35
//     const processedData = {
//       ...sensorData,
//       alert: sensorData.temperature > 35 ? 'high' : 'normal',
//     };

//     // Create a producer instance for sending processed data
//     const producer = new Kafka.Producer(kafkaConfig);
//     producer.connect();

//     producer.on('ready', () => {
//       // Send processed data to another topic
//       producer.produce(
//         ANALYSIS_TOPIC,
//         null,
//         Buffer.from(JSON.stringify(processedData)),
//         null, // Key can be null or specified if needed
//         Date.now() // Timestamp for the message
//       );

//       console.log('Processed data sent to analysis topic:', processedData);
//       producer.disconnect(); // Disconnect after sending
//     });

//     producer.on('event.error', (err) => {
//       console.error('Producer error:', err);
//     });
    
//   } catch (error) {
//     console.error('Error processing message:', error);
//   }
// });

// stream.on('event.error', (err) => {
//   console.error('Stream error:', err);
// });