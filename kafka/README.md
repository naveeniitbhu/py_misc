# Kafka (KRaft) using Apache Kafka.

| Term           | Meaning                     |
| -------------- | --------------------------- |
| Broker         | Kafka server                |
| Topic          | Category / stream of events |
| Partition      | Ordered log inside a topic  |
| Offset         | Position in the log         |
| Consumer group | Logical subscriber          |
| Retention      | How long messages are kept  |

# Install

docker-compose up -d
kafka-broker-api-versions.sh --bootstrap-server localhost:9092
(This checks if kafka is runnning)

Two ways to test kafak:

1. via terminal directly
2. via python script

Method 1:
docker run --rm -it --network host apache/kafka:latest bash
export PATH=$PATH:/opt/kafka/bin

docker run --rm -it --network host confluentinc/cp-kafka:7.6.0 bash
export PATH=$PATH:/opt/kafka/bin

kafka-topics --bootstrap-server localhost:9092 --list

Terminal-A
kafka-topics \
 --bootstrap-server localhost:9092 \
 --create \
 --topic orders \
 --partitions 1 \
 --replication-factor 1

kafka-console-consumer \
 --bootstrap-server localhost:9092 \
 --topic orders \
 --group live-group

Terminal-B
kafka-console-producer --bootstrap-server localhost:9092 --topic orders

Method: 2
python main.py
(you can adjust sleep time in script)

kcat -b localhost:9092 -C -t weather_data_demo -o end

# Other Info

This docker-compose.yml service is starting one Kafka node that acts as:

Broker → handles producers & consumers
Controller → manages metadata (KRaft mode, no ZooKeeper)

9092 = Kafka client port
Producers & consumers connect here

Environment variables (this is the core)

KAFKA_NODE_ID: 1
Unique ID of this Kafka node.
Required for KRaft mode
Must be unique per node
Even single-node clusters still need it.

KAFKA_PROCESS_ROLES: broker,controller
broker → handles data
controller → manages metadata
broker,controller → both (single-node setup)

KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
Defines which nodes are controllers.
nodeId@host:port

KAFKA_LISTENERS: PLAINTEXT://kafka:9092,CONTROLLER://kafka:9093
Defines where Kafka listens.
Two listeners:
PLAINTEXT://kafka:9092. // Used by producers & consumers
Internal Docker network hostname = kafka

CONTROLLER://kafka:9093
Used for controller communication
Internal only

KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
“When you connect to Kafka, THIS is the address you should use.”
Kafka sends metadata to clients
Clients reconnect using advertised address

Rule to remember:

LISTENERS = where Kafka listens
ADVERTISED_LISTENERS = what Kafka tells clients
KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
KAFKA_CONTROLLER_LISTENER_NAMES

##

What is \_\_consumer_offsets?

It’s an internal Kafka topic

Kafka stores consumer group offsets there

Without it:

consumer groups don’t work

consumers appear to read “nothing”

offsets can’t be committed

With ZooKeeper-based Kafka

ZooKeeper already handles cluster metadata & coordination

Kafka has used this model for over a decade

On startup:

controller is elected

metadata is stable

\_\_consumer_offsets is created once and correctly

Result:
✅ consumers work immediately
✅ offsets commit reliably

With KRaft (no ZooKeeper)

Kafka must:

elect a controller

bootstrap metadata

create internal topics

If anything about listeners/hostnames is wrong →

More precisely:

Kafka starts

Kafka connects to ZooKeeper

ZooKeeper:

registers the broker

elects a controller

Kafka becomes ready to accept producers/consumers

Consumer offsets are stored and coordinated correctly

This connection is defined here:

KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181

That line literally means:

“Kafka, talk to ZooKeeper at service zookeeper on port 2181.”
