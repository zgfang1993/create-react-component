#!/usr/bin/env node

const pkg = require('../package.json');
const program = require('commander');
const inquirer = require('inquirer');
const download = require('download-git-repo');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const spinner = ora();
const semver = require('semver');
const handlebars = require('handlebars');

const downloadTemplate = async (filePath) => {
	return new Promise((resolve,reject)=>{
		spinner.start('loading');
		download('direct:https://github.com/zgfang1993/react-component-template.git', filePath, {
			clone: true
		}, function (err) {
			console.log(err)
			if (err) {
				spinner.fail(err);
				reject()
			};
			resolve();
		})
	})

}
const updateTemplate = async (filePath, info) => {
	const obj = {
		...info,
		repoName: info.name,
	};
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, (err, data) => {
			if (err) {
				console.log(chalk.red(err));
				reject(err);
			}
			fs.outputFile(filePath, handlebars.compile(data.toString())(obj), (err) => {
				if (err) {
					console.log(chalk.red(err));
					reject(err);
				}
				resolve();
			});
		});
	});
}

program
	.version(pkg.version)
	.usage('[command] [options]')
	.option("-i, --init", 'init or update pack tool')
	.description(pkg.description)

program
	.command('init')
	.alias('i')
	.description('新建脚手架\n    例如：create-react-component init\n')
	.action(async function (templateName) {
		if (typeof templateName !== 'string') {
			templateName = 'default';
		}

		const questions = [
			{
				type: 'input',
				name: 'name',
				message: '请输入项目名称',
				default: 'react-component',
				validate: (name) => {
					if (/^[a-z]+/.test(name)) {
						return true;
					} else {
						return '项目名称必须以小写字母开头';
					}
				},
			},
			{
				type: 'input',
				name: 'version',
				default:'1.0.0',
				validate: function (value) {
					if(!semver.valid(value)){
						return chalk.red(`版本号格式不对，请重新输入`);
					}
					return true;
				}
			},
			{
				type: 'input',
				name: 'description',
				message: '请输入项目描述'
			},
		]
		const res = await inquirer.prompt(questions);
		const {name, version, description} = res;
		const filePath = path.resolve(name);

		// 判断新项目名是否重复
		if(fs.existsSync(filePath)){
			console.log(chalk.red(`当前目录已存在${name}模块`))
			process.exit(1);
		}

		// 下载模板
		await downloadTemplate(filePath);

		// 更新模板
		await updateTemplate(`${filePath}/package.json`, res);

		spinner.succeed('创建完成');
	});

program.parse(process.argv); 