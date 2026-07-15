# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUser, getMyProfile, listCourses, recordAttendance } from '@dataconnect/generated';


// Operation CreateUser:  For variables, look at type CreateUserVars in ../index.d.ts
const { data } = await CreateUser(dataConnect, createUserVars);

// Operation GetMyProfile:  For variables, look at type GetMyProfileVars in ../index.d.ts
const { data } = await GetMyProfile(dataConnect, getMyProfileVars);

// Operation ListCourses: 
const { data } = await ListCourses(dataConnect);

// Operation RecordAttendance:  For variables, look at type RecordAttendanceVars in ../index.d.ts
const { data } = await RecordAttendance(dataConnect, recordAttendanceVars);


```