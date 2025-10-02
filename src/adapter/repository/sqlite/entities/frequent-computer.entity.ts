import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ tableName: "frequent_computers" })
export class FrequentComputerEntity {
  @PrimaryKey()
  id!: string;               // DeviceId (mismo id del computer frecuente)

  @Property()
  brand!: string;

  @Property()
  model!: string;

  @Property()
  ownerId!: string;

  @Property()
  ownerName!: string;

  @Property()
  photoURL!: string;

  @Property()
  createdAt!: Date;          // fecha de registro como frecuente

  @Property({ nullable: true })
  lastCheckinAt?: Date;      // última entrada (si aplica)

  @Property({ nullable: true })
  lastCheckoutAt?: Date;     // última salida (si aplica)

  @Property()
  updatedAt!: Date;
}
