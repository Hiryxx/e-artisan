import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const dropTestDb = () => {
    const dbName = process.env.DATABASE;
    const user = process.env.DB_USER;

    exec(`psql -U ${user} -c "DROP DATABASE IF EXISTS ${dbName};"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error dropping test database: ${error.message}`);
        } else {
            console.log(`Test database ${dbName} dropped successfully`);
        }
    });
};

dropTestDb();