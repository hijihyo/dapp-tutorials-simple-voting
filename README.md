# DApp Tutorials : Simple Voting
----------

* 컨트랙트 수정 시
    1. `truffle compile`
    2. `truffle migrate --reset`
    3. simple-voting/build/contracts/SimpleVoting.json 파일을 simple-voting-webui/contract/ 폴더 내에 복사

* 사용 방법
    1. at 'simple-voting'
        `ganache-cli > log/ganache.lo`
    2. at 'simple-voting'
        `truffle migrate --reset`
    3. simple-voting/build/contracts/SimpleVoting.json 파일을 simple-voting-webui/contract/ 폴더 내에 복사
    4. at 'simple-voting-webui'
        `node webserver.js`