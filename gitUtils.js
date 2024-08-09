// gitUtils.js
import { exec } from 'child_process';
import path from 'path';

const devDir = process.env.DEV_DIR || '/Users/shigoto/仕事/GitHub';

export function getProjects() {
    return new Promise((resolve, reject) => {
        exec(`ls -d ${devDir}/*/`, (error, stdout, stderr) => {
            if (error) {
                return reject(`エラー: ${stderr}`);
            }
            const projects = stdout.split('\n').filter(Boolean).map(dir => path.basename(dir));
            resolve(projects);
        });
    });
}

export function getStatus(projectPath) {
    return new Promise((resolve, reject) => {
        exec(`git -C ${projectPath} status --short`, (error, stdout, stderr) => {
            if (error) {
                return reject(`エラー: ${stderr}`);
            }
            const rawStatusList = stdout.split('\n').filter(Boolean);
            const statusList = rawStatusList.map(line => {
                const parts = line.trim().split(/\s+/);
                return parts.slice(1).join(' ');
            });
            resolve(statusList);
        });
    });
}

export function stageFiles(projectPath, filePaths) {
    return new Promise((resolve, reject) => {
        const resolvedPaths = filePaths.map(fp => path.resolve(projectPath, fp));
        const command = `git -C ${projectPath} add ${resolvedPaths.join(' ')}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(`エラー: ${stderr}`);
            }
            resolve('ステージングが成功しました');
        });
    });
}
