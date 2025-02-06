const { Client } = require('@notionhq/client');

const notion = new Client({ 
    auth: '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'
});

async function testNotion() {
    try {
        const response = await notion.databases.retrieve({ 
            database_id: '173a434d112e812f8d16f1c8a61fa576' 
        });
        console.log('Database retrieved successfully:', response);
    } catch (error) {
        console.error('Error retrieving database:', error);
    }
}

testNotion();