require('dotenv').config();

const path = require('path');
const GitHub = require('github-api');
const Git = require("nodegit");
const shell = require('shelljs');
const fs = require('fs-extra');
const mkDirByPathSync = x => shell.mkdir('-p', path.join(__dirname, x));
const token = process.env.github_token;
const gh = new GitHub({token});

const me = gh.getUser();
me
    .getProfile()
    .then(user => {
        const username = user.data.login;
        me
            .listRepos({type: 'owner'})
            .then((data) => {
                const ownedRepositories = data
                    .data
                    .filter(x => x.owner.login === username && !x.fork);
                const forkedRepositories = data
                    .data
                    .filter(x => x.owner.login === username && x.fork);

                const privateOwnedRepositories = ownedRepositories.filter(x => x.private === true);
                const publicOwnedRepositories = ownedRepositories.filter(x => x.private === false);

                const public_dir = 'repos/public';
                const private_dir = 'repos/private';
                mkDirByPathSync(public_dir);
                mkDirByPathSync(private_dir);

                publicOwnedRepositories.forEach(repo => {
                    Git
                        .Clone(repo.clone_url, `${public_dir}/${repo.name}`)
                        .then((a) => {})
                        .catch(err => console.error(err));
                });
                privateOwnedRepositories.forEach(repo => {
                    const cloneURL = `https://${token}:x-oauth-basic@github.com/${repo.name}`;

                    const cloneopts = {
                        fetchOpts: {
                            callbacks: {
                                credentials: function () {
                                    return Git
                                        .Cred
                                        .userpassPlaintextNew(token, "x-oauth-basic");
                                },
                                certificateCheck: function () {
                                    return 1;
                                }
                            }
                        }
                    };
                    Git
                        .Clone(repo.clone_url, `${private_dir}/${repo.name}`, cloneopts)
                        .then((a) => {})
                        .catch(err => console.error(err));
                });
            })
            .catch(err => console.error(err));
    })
    .catch(err => console.error(err));