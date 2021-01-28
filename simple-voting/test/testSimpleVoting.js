const SimpleVoting = artifacts.require("./SimpleVoting.sol");

contract('SimpleVoting', function (accounts) {
    // 관리자가 아닌 투표자가 제안 등록 세션을 종료할 경우 예외가 발생하는 '네거티브 테스트'
    contract('SimpleVoting.endProposalsRegistration - ' +
        'onlyAdministrator modifier', function (accounts) {
        
        it("should allow ending proposals session only by an administrator",
            async function () {
                let simpleVotingInstance = await SimpleVoting.deployed();
                let votingAdministrator = await simpleVotingInstance.administrator();
                let nonVotingAdministrator = web3.eth.accounts[1];

                try {
                    await simpleVotingInstance.endProposalsRegistration(
                        { from : nonVotingAdministrator }
                    );
                    assert.isTrue(false); // 윗줄에서 예외가 발생하지 않을 경우 테스트 실패
                }
                catch (e) {
                    assert.isTrue(votingAdministrator != nonVotingAdministrator);
                    assert.equal(e, 'Error: VM Exception while processing transaction: ' +
                        'revert the caller of this function must be the administrator');
                    // 테스트 통과
                }
            }
        );
    });

    // 제안서 등록 세션이 시작되지 않았을 때 관리자가 제안 등록 세션을 종료할 수 없는지
    // 확인하는 '네거티브 테스트'
    contract('SimpleVoting.endProposalsRegistration - ' +
        'onlyDuringProposalsRegistration modifier', function (accounts) {

        it('should allow ending proposals registration only during ' +
            'proposals registration',
            async function () {
                let simpleVotingInstance = await SimpleVoting.deployed();
                let votingAdministrator = await simpleVotingInstance.administrator();

                try {
                    await simpleVotingInstance.endProposalsRegistration(
                        { from : votingAdministrator }
                    );
                    assert.isTrue(false); // 윗줄에서 예외가 발생하지 않을 경우 테스트 실패
                }
                catch (e) {
                    assert.equal(e, 'Error: VM Exception while processing transaction: ' +
                        'revert this function can be called only during proposals ' +
                        'registration');
                    // 테스트 통과
                }
            }
        );
    });

    // 제안서 등록 세션이 시작된 후 관리자가 성공적으로 종료할 수 있는지 확인하는
    // '포지티브 테스트'
    contract('SimpleVoting.endProposalsRegistration - successful', function (accounts) {
        it('should allow ending proposals registration by an administrator ' +
            'during proposals registration',
            async function () {
                let simpleVotingInstance = await SimpleVoting.deployed();
                let votingAdministrator = await simpleVotingInstance.administrator();

                await simpleVotingInstance.startProposalsRegistration(
                    { from : votingAdministrator }
                );
                
                let workflowStatus = await simpleVotingInstance.getWorkflowStatus();
                let expectedWorkflowStatus = 1;
                
                assert.equal(workflowStatus.valueOf(), expectedWorkflowStatus,
                    'The current workflow status does not correspond to ' +
                    'proposal registration session started');

                await simpleVotingInstance.endProposalsRegistration(
                    { from : votingAdministrator }
                );

                let newWorkflowStatus = await simpleVotingInstance.getWorkflowStatus();
                let newExpectedWorkflowStatus = 2;

                assert.equal(newWorkflowStatus.valueOf(), newExpectedWorkflowStatus,
                    'The current workflow status does not correspond to ' +
                    'proposal registration session ended');
            }    
        );
    });
})