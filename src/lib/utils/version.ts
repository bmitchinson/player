import { env } from '$env/dynamic/public';

const commitSha = env.PUBLIC_COMMIT_SHA || 'development';

export const version = {
	commitSha,
	shortSha: commitSha !== 'development' ? commitSha.substring(0, 7) : 'dev',
	repositoryUrl: 'https://github.com/bmitchinson/player'
};
