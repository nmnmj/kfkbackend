import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

export const kafkaConfig = {
  'metadata.broker.list': process.env.KAFKA_BROKER_LIST,
  'security.protocol': 'ssl',
  'ssl.key.location': path.resolve('service.key'),
  'ssl.certificate.location': path.resolve('service.cert'),
  'ssl.ca.location': path.resolve('ca.pem'),
  dr_cb: true, 
};

export const kafkaConsumerConfig = {
    'metadata.broker.list': process.env.KAFKA_BROKER_LIST,
    'group.id': 'blog_id',
    "security.protocol": "ssl",
    'ssl.key.location': path.resolve('service.key'),
    'ssl.certificate.location': path.resolve('service.cert'),
    'ssl.ca.location': path.resolve('ca.pem'),
};
