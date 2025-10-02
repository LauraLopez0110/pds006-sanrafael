import { Entity, PrimaryKey, Property, Unique } from "@mikro-orm/core";

@Entity({ tableName: "medical_devices" })
export class MedicalDeviceEntity {
  @PrimaryKey()
  id!: string;

  @Property()
  brand!: string;

  @Property()
  model!: string;

  @Property()
  photoURL!: string;

  @Property()
  ownerId!: string;

  @Property()
  ownerName!: string;

  @Property({ nullable: true })
  checkinAt?: Date;

  @Property({ nullable: true })
  checkoutAt?: Date;

  @Property()
  @Unique()
  serial!: string;           // del domain

  @Property()
  updatedAt!: Date;
}
