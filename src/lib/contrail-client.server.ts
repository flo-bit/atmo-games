import { env } from '$env/dynamic/private';
import {
	contrailApi,
	createContrailClient,
	createLocalContrailClient
} from '$lib/contrail/index.js';
import {
	CONTRAIL_ENDPOINT,
	CONTRAIL_SCOPE,
	CONTRAIL_SERVICE_AUDIENCE,
	CONTRAIL_SERVICE_DID
} from '$lib/contrail-target';

const productionContrail = createContrailClient({
	endpoint: CONTRAIL_ENDPOINT,
	serviceDid: CONTRAIL_SERVICE_DID,
	serviceAudience: CONTRAIL_SERVICE_AUDIENCE,
	scope: CONTRAIL_SCOPE,
	protectedMethods: contrailApi.protectedMethods,
	serviceMethods: contrailApi.serviceMethods,
	collections: contrailApi.collections,
	notifyMethod: contrailApi.notifyMethod
});

export const contrail = env.CONTRAIL_URL
	? createLocalContrailClient(env.CONTRAIL_URL)
	: productionContrail;
