// export type User = {
//   id: string;
//   name: string;
//   phone: string;
//   email: string;
//   time: string;
//   game: string;
// };
//
// export type SignupFormState =
//   | {
//       errors?: {
//         name?: string[];
//         email?: string[];
//         telegram?: string[];
//         phone?: string[];
//         password?: string[];
//       };
//       message?: string;
//     }
//   | undefined;

// export type Table = {
//   userId: string;
//   id: string;
//   date: daystring;
//   tableName: string;
//   status: string;
//   club: string;
// };

export type dayString = string | string[] | undefined;

export type SignupFieldType = {
  name?: string;
  email: string;
  telegram?: string;
  phone?: string;
  password: string;
};

export type Club = {
  id: string;
  name: string;
  location: string;
  tables: Table[];
};

export type Table = {
  id: string;
  name: string;
  clubId: string;
  club: Club;
  bookings: Booking[];
};

export type Booking = {
  id: string;
  userId: string;
  tableId: string;
  date: dayString;
  approved: boolean;

  user: User;
  table: Table;
};

export type User = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
  bookings: Booking;
};

export enum Role {
  USER,
  ADMIN,
}
