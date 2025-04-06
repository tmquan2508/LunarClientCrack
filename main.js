const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const readline = require('node:readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const question = (query) => new Promise((resolve) => {
	rl.question(query, resolve);
});

const accountsFile = path.join(os.homedir(), '.lunarclient', 'settings', 'game', 'accounts.json')
if (!fs.existsSync(accountsFile)) {
    fs.mkdirSync(path.dirname(accountsFile), { recursive: true });
    fs.writeFileSync(accountsFile, JSON.stringify({ accounts: {} }, null, 2));
}
const accountsData = JSON.parse(fs.readFileSync(accountsFile))

async function home() {
	console.clear()
	console.log('What you like to do:')
	console.log('1. Create Account')
	console.log('2. Remove Accounts')
	console.log('3. View Installed Accounts')
	console.log('4. Exit the program')
	let option = await question('Please type your option (1-4) here: ')
	if (option == 1) {
		await createAccount()
		returnHome()
	} else if (option == 2) {
		await removeAccounts()
		returnHome()
	} else if (option == 3) {
		showAccounts()
		returnHome()
	} else if (option == 4) {
		process.exit()
	} else {
		console.log('Your choice is invalid. Please pick an option (1-4).')
		returnHome()
	}
}

function returnHome() {
	question('Press ENTER to return to the main menu...').then(() => {
		home()	
	})
}

async function createAccount() {
	console.clear();
	const username = await question('Enter your desired username: ');

	if (username.includes(' ') || username.length === 0 || username.length < 3 || username.length > 16) {
		console.log('[WARNING] You may experience issues joining servers because of your username being invalid.');
	}

	async function getUUID() {
		const uuid = await question('Enter a valid UUID: ');
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

		if (!uuidRegex.test(uuid)) {
			const retry = await question('Would you like to try again? (y/n): ');
			if (retry.toLowerCase() === 'y') {
				return getUUID();
			} else {
				console.log('Returning to main menu.');
				return null;
			}
		}
		return uuid;
	}

	const uuid = await getUUID();
	if (!uuid) {
		return;
	}

	accountsData.activeAccountLocalId = accountsData.activeAccountLocalId || uuid;

	if (!accountsData.accounts) {
		accountsData.accounts = {};
	}

	accountsData.accounts[uuid] = {
		accessToken: uuid,
		accessTokenExpiresAt: "2050-07-02T10:56:30.717167800Z",
		eligibleForMigration: false,
		hasMultipleProfiles: false,
		legacy: true,
		persistent: true,
		userProperites: [],
		localId: uuid,
		minecraftProfile: {
			id: uuid,
			name: username
		},
		remoteId: uuid,
		type: "Xbox",
		username: username
	};

	fs.writeFileSync(accountsFile, JSON.stringify(accountsData, null, 2));
	console.log('Your account has successfully been created.');
}

async function removeAccounts() {
	console.clear()
	console.log('Choose an option to remove accounts:')
	console.log('1. Remove All Accounts')
	console.log('2. Remove Cracked Accounts (accessToken is not a UUID)')
	console.log('3. Remove Premium Accounts (accessToken is a UUID)')
	let option = await question('Please type your option (1-3) here: ')
	if (option == 1) {
		accountsData.accounts = {}
		fs.writeFileSync(accountsFile, JSON.stringify(accountsData, null, 2))
		console.log('All accounts have been removed.')

	} else if (option == 2) {
		const filteredAccounts = Object.fromEntries(
			Object.entries(accountsData.accounts).filter(([id, acc]) => id === acc.accessToken)
		);
		accountsData.accounts = filteredAccounts;
		fs.writeFileSync(accountsFile, JSON.stringify(accountsData, null, 2))
		console.log('Cracked accounts have been successfully removed.')
	} else if (option == 3) {
		const filteredAccounts = Object.fromEntries(
			Object.entries(accountsData.accounts).filter(([id, acc]) => id !== acc.accessToken)
		);
		accountsData.accounts = filteredAccounts;
		fs.writeFileSync(accountsFile, JSON.stringify(accountsData, null, 2))
		console.log('Premium accounts have been successfully removed.')

	} else {
		console.log('An error occurred: Input string was not in a correct format.')
	}
}

function showAccounts() {
	console.log('Installed Accounts:')
	Object.entries(accountsData.accounts).forEach(([id, acc]) => console.log(`${id}: ${acc.username}`))
}

home()