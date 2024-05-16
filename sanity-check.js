const clientLibrary = require('./VVRestApi');

let output = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Sanity Check</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
<div class="mx-4 my-6">
`;

const V5_DEV_CREDENTIALS = {
    customerAlias: '',
    databaseAlias: '',
    userId: '',
    password: '',
    clientId: '',
    clientSecret: '',
    baseUrl: '',
    environmentName: 'V5 Dev',
};
const V5_SANDBOX_CREDENTIALS = {
    customerAlias: '',
    databaseAlias: '',
    userId: '',
    password: '',
    clientId: '',
    clientSecret: '',
    baseUrl: '',
    environmentName: 'V5 Sandbox',
};
const V5_QA_CREDENTIALS = {
    customerAlias: '',
    databaseAlias: '',
    userId: '',
    password: '',
    clientId: '',
    clientSecret: '',
    baseUrl: '',
    environmentName: 'V5 QA',
};

const migrationFrom = V5_DEV_CREDENTIALS;
const migrationTo = V5_QA_CREDENTIALS;

const vvAuthorize = new clientLibrary.authorize();

async function main(
    vvClient1, 
    vvClient2, 
    response, 
    environmentName1, 
    environmentName2
) {
    // Helper Functions

    /**
     * Generic JSON parsing function
     * 
     * @param {Promise} vvClientRes JSON response from a vvClient API method
     * @returns {Promise} A Promise
     */
    function parseRes(vvClientRes) {
        try {
            // Parses the response in case it's a JSON string
            const jsObject = JSON.parse(vvClientRes);
            // Handle non-exception-throwing cases:
            if (jsObject && typeof jsObject === 'object') {
                vvClientRes = jsObject;
            }
        } catch (e) {
            // If an error occurs, it's because the resp is already a JS object and doesn't need to be parsed
        }
        return vvClientRes;
    }

    /** 
     * Checks that the meta property of a vvClient API response object has the expected status code
     * 
     * @param {Promise} vvClientRes Parsed response object from a vvClient API method
     * @param {Number} ignoreStatusCode An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
     * @returns {Promise} A Promise wit the
     */
    function checkMetaAndStatus(vvClientRes, ignoreStatusCode = 999) {
        if (!vvClientRes.meta) {
            throw new Error(`Error on checkMetaAndStatus. No meta object found in response. Check method call parameters and credentials.`);
        }

        const status = vvClientRes.meta.status;

        // If the status is not the expected one, throw an error
        if (status != 200 && status != 201 && status != ignoreStatusCode) {
            const errorReason = vvClientRes.meta.errors && vvClientRes.meta.errors[0] ? vvClientRes.meta.errors[0].reason : 'unspecified';
            throw new Error(`Error on checkMetaAndStatus. Status: ${vvClientRes.meta.status}. Reason: ${errorReason}`);
        }

        return vvClientRes;
    }

    /**
     * Checks that the data property of a vvClient API response object exists
     * 
     * @param {Promise} vvClientRes Parsed response object from the API call
     * @param {Number} ignoreStatusCode An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
     * @returns {Promise} A Promise
     */
    function checkDataPropertyExists(vvClientRes, ignoreStatusCode = 999) {
        const status = vvClientRes.meta.status;

        if (status != ignoreStatusCode) {
            // If the data property doesn't exist, throw an error
            if (!vvClientRes.data) {
                throw new Error(`Data property was not present. Please, check parameters and syntax. Status: ${status}.`);
            }
        }

        return vvClientRes;
    }

    /**
     * Checks that the data property of a vvClient API response object is not empty
     * 
     * @param {Promise} vvClientRes Parsed response object from the API call 
     * @param {Number} ignoreStatusCode An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
     * @returns {Promise} A Promise
     */
    function checkDataIsNotEmpty(vvClientRes, ignoreStatusCode = 999) {
        const status = vvClientRes.meta.status;

        if (status != ignoreStatusCode) {
            const dataIsArray = Array.isArray(vvClientRes.data);
            const dataIsObject = typeof vvClientRes.data === 'object';
            const isEmptyArray = dataIsArray && vvClientRes.data.length == 0;
            const isEmptyObject = dataIsObject && Object.keys(vvClientRes.data).length == 0;

            // If the data is empty, throw an error
            if (isEmptyArray || isEmptyObject) {
                throw new Error(`Returned no data. Please, check parameters and syntax. Status: ${status}.`);
            }
            // If it is a Web Service response, check that the first value is not an Error status
            if (dataIsArray) {
                const firstValue = vvClientRes.data[0];

                if (firstValue == 'Error') {
                    throw new Error(`Returned an error. Please, check called Web Service. Status: ${status}.`);
                }
            }
        }
        return vvClientRes;
    }
    // <- Helper Functions

    // Form Templates
    let templatesEnvironment1 = await vvClient1.forms.getFormTemplates()
        .then(res => parseRes(res))
        .then(res => checkMetaAndStatus(res))
        .then(res => checkDataPropertyExists(res))
        .then(res => checkDataIsNotEmpty(res));
    let templatesEnvironment2 = await vvClient2.forms.getFormTemplates()
        .then(res => parseRes(res))
        .then(res => checkMetaAndStatus(res))
        .then(res => checkDataPropertyExists(res))
        .then(res => checkDataIsNotEmpty(res));

    templatesEnvironment1 = templatesEnvironment1.data;
    templatesEnvironment2 = templatesEnvironment2.data;

    let promises = [];

    for (const template of templatesEnvironment2) {
        const { apiUrl, baseUrl, accessToken } = vvClient2._httpHelper._sessionToken;
        const templateApiUrl = `${baseUrl}/${apiUrl}/formtemplates/${template.id}/forms?expand=true`;
        const response = fetch(templateApiUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        promises.push(response);
    }

    await Promise.all(promises)
    .then(responses => {
        output += `
            <h1 class="text-lg font-semibold mb-4">Form Templates</h1>
            <p class="mb-4">The following templates were checked if they are accessible from the API</p>
            <div class="overflow-x-auto">
                <table class="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            <th class="border border-gray-300 px-4 py-2">Form Template Name</th>
                            <th class="border border-gray-300 px-4 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const response of responses) {
            const templateIdRegex = /formtemplates\/(\S+)\//;
            const templateIdMatch = response.url.match(templateIdRegex);
            const template = templatesEnvironment2.find(template => template.id === templateIdMatch[1]);
            const templateUrl = `<tr class="border border-gray-300"><td class="border border-gray-300 px-4 py-2"><a href="${response.url}" target="_blank">${template.name}</a></td>`;
            if (response.ok) {
                output += `${templateUrl} <td class="border border-gray-300 px-4 py-2" style="color:green">OK</td></tr>`;
            } else {
                output += `${templateUrl} <td class="border border-gray-300 px-4 py-2" style="color:red">${response.statusText}</td></tr>`;
            }
        }
        output += '</tbody></table></div>';
    });


    // Form Records
    const formsToCheck = [
        'Email Notification',
        'zDropdown List Form',
        'Process Timeframe',
        'zFirstNameLookup'
    ];
    
    output += `
        <h1 class="text-xl font-semibold mt-6 mb-4">Form Records</h1>
        <div class="overflow-x-auto">
            <table class="table-auto w-full border-collapse border border-gray-300">
                <thead>
                    <tr>
                        <th class="border border-gray-300 px-4 py-2">Form Name</th>
                        <th class="border border-gray-300 px-4 py-2">${environmentName1} Count</th>
                        <th class="border border-gray-300 px-4 py-2">${environmentName2} Count</th>
                        <th class="border border-gray-300 px-4 py-2">Passed</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    for (const formName of formsToCheck) {
        const params = { expand: false };
        const getFormsRes1 = await vvClient1.forms.getForms(params, formName)
            .then(res => parseRes(res))
            .then(res => checkMetaAndStatus(res))
            .then(res => checkDataPropertyExists(res))
            .then(res => checkDataIsNotEmpty(res));
        const getFormsRes2 = await vvClient2.forms.getForms(params, formName)
            .then(res => parseRes(res))
            .then(res => checkMetaAndStatus(res))
            .then(res => checkDataPropertyExists(res))
            .then(res => checkDataIsNotEmpty(res));
        
        const env1Count = getFormsRes1.data.length;
        const env2Count = getFormsRes2.data.length;
        
        output += '<tr class="border border-gray-300">';
        output += `<td class="border border-gray-300 px-4 py-2">${formName}</td>`;
        output += `<td class="border border-gray-300 px-4 py-2">${env1Count}</td>`;
        output += `<td class="border border-gray-300 px-4 py-2">${env2Count}</td>`;
        output += `<td class="border border-gray-300 px-4 py-2">${env1Count === env2Count ? '<span style="color:green">YES</span>' : '<span style="color:red">NO</span>'}</td>`;
        output += '</tr>';
    }
    
    output += `
                </tbody>
            </table>
        </div>
    `;
    
    
    output += `
                </div>
            </body>
        </html>
    `;

    return response.send(output);
}

const SanityCheck = async (req, res) => {
    try {
        const authorizationFrom = await vvAuthorize.getVaultApi(
            migrationFrom.clientId, 
            migrationFrom.clientSecret, 
            migrationFrom.userId, 
            migrationFrom.password, 
            migrationFrom.baseUrl, 
            migrationFrom.customerAlias, 
            migrationFrom.databaseAlias
        );
        
        const authorizationTo = await vvAuthorize.getVaultApi(
            migrationTo.clientId, 
            migrationTo.clientSecret, 
            migrationTo.userId, 
            migrationTo.password, 
            migrationTo.baseUrl, 
            migrationTo.customerAlias, 
            migrationTo.databaseAlias
        );
    
        await main(
            authorizationFrom, 
            authorizationTo, 
            res, 
            migrationFrom.environmentName,
            migrationTo.environmentName
        );
    } catch (err) {
        console.log('===============================');
        console.log('Message:', err.message);
        console.log('===============================');
        console.log('Error:');
        console.error(err);
        console.log('===============================');

        return response.send('There was an error: ' + err.message, { status: 500 });
    }
};

module.exports = SanityCheck;