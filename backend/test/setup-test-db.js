import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const createTestDb = () => {
    const dbName = process.env.DATABASE;
    const user = process.env.DB_USER;

    exec(`psql -U ${user} -c "CREATE DATABASE ${dbName};"`, (error, stdout, stderr) => {
        if (error) {
            if (error.message.includes('already exists')) {
                console.log(`Test database ${dbName} already exists`);
            } else {
                console.error(`Error creating test database: ${error.message}`);
            }
        } else {
            console.log(`Test database ${dbName} created successfully`);
        }
    });
};

createTestDb();