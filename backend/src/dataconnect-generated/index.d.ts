import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Attendance_Key {
  id: UUIDString;
  __typename?: 'Attendance_Key';
}

export interface Course_Key {
  id: UUIDString;
  __typename?: 'Course_Key';
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  name: string;
  email: string;
  role: string;
}

export interface GetMyProfileData {
  user?: {
    name: string;
    email: string;
    role: string;
    profilePictureUrl?: string | null;
  };
}

export interface GetMyProfileVariables {
  id: UUIDString;
}

export interface LectureAccess_Key {
  id: UUIDString;
  __typename?: 'LectureAccess_Key';
}

export interface LectureContent_Key {
  id: UUIDString;
  __typename?: 'LectureContent_Key';
}

export interface ListCoursesData {
  courses: ({
    courseCode: string;
    courseName: string;
    professor: {
      name: string;
    };
  })[];
}

export interface RecordAttendanceData {
  attendance_insert: Attendance_Key;
}

export interface RecordAttendanceVariables {
  sessionId: UUIDString;
  studentId: UUIDString;
  status: string;
}

export interface Session_Key {
  id: UUIDString;
  __typename?: 'Session_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface GetMyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMyProfileVariables): QueryRef<GetMyProfileData, GetMyProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetMyProfileVariables): QueryRef<GetMyProfileData, GetMyProfileVariables>;
  operationName: string;
}
export const getMyProfileRef: GetMyProfileRef;

export function getMyProfile(vars: GetMyProfileVariables, options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, GetMyProfileVariables>;
export function getMyProfile(dc: DataConnect, vars: GetMyProfileVariables, options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, GetMyProfileVariables>;

interface ListCoursesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListCoursesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListCoursesData, undefined>;
  operationName: string;
}
export const listCoursesRef: ListCoursesRef;

export function listCourses(options?: ExecuteQueryOptions): QueryPromise<ListCoursesData, undefined>;
export function listCourses(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListCoursesData, undefined>;

interface RecordAttendanceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RecordAttendanceVariables): MutationRef<RecordAttendanceData, RecordAttendanceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RecordAttendanceVariables): MutationRef<RecordAttendanceData, RecordAttendanceVariables>;
  operationName: string;
}
export const recordAttendanceRef: RecordAttendanceRef;

export function recordAttendance(vars: RecordAttendanceVariables): MutationPromise<RecordAttendanceData, RecordAttendanceVariables>;
export function recordAttendance(dc: DataConnect, vars: RecordAttendanceVariables): MutationPromise<RecordAttendanceData, RecordAttendanceVariables>;

