let web3 = window.web3 ?
  new Web3(window.web3.currentProvider) :
  new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

let SimpleVoting;
let simpleVoting;

let voterRegisteredEvent;
let proposalsRegistrationStartedEvent;
let proposalsRegistrationEndedEvent;
let proposalRegisteredEvent;
let votingSessionStartedEvent;
let votingSessionEndedEvent;
let votedEvent;
let votesTalliedEvent;
let workflowStatusChangedEvent;

window.onload = function () {
    $.getJSON("./contract/SimpleVoting.json", function (json) {
        SimpleVoting = TruffleContract(json);
        SimpleVoting.setProvider(new Web3.providers.HttpProvider("http://localhost:8545"));

        SimpleVoting.deployed()
            .then (instance => {
                simpleVoting = instance;
                refreshWorkflowStatus();
            });
    });
}


function unlockAdmin() {
    $("unlockAdminMessage").html("");

    const adminAddress = $("#adminAddress").val();
    const adminPassword = $("#adminPassword").val();

    web3.personal.unlockAccount(adminAddress, adminPassword, 180,
        function (error, result) {
                if (!error && result)
                    $("#unlockAdminMessage").html("The account is unlocked");
                else
                    $("#unlockAdminMessage").html("The account cannot be unlocked");
        }
    );
}
function unlockVoter() {
    $("#unlockVoterMessage").html("");

    var voterAddress = $("#voterAddress").val();
    var voterPassword = $("#voterPassword").val();

    web3.personal.unlockAccount(voterAddress, voterPassword, 180,
        function (error, result) {
                if (!error && result)
                    $("#unlockVoterMessage").html("The account is unlocked");
                else
                    $("#unlockVoterMessage").html("The account cannot be unlocked");
        }
    );
}

function registerVoter() {
    $("#registerVoterMessage").html("");

    const adminAddress = $("#adminAddress").val();
    const voterAddress = $("#voterAddress").val();

    simpleVoting.isAdministrator(adminAddress)
        .then (result => {
            if (result) {
                simpleVoting.isRegisteredVoter(voterAddress)
                    .then (result => {
                        if (result)
                            $("#registerVoterMessage").html("The voter has already been registered");
                        else {
                            simpleVoting.registerVoter(voterAddress, {
                                from : adminAddress,
                                gas : 200000,
                            }).then (() => 
                                $("#registerVoterMessage").html("The voter is registered successfully")
                            ).catch (e =>
                                $("#registerVoterMessage").html(e)
                            );
                        }
                    });
            }
            else
                $("#registerVoterMessage").html("The address in the 'Admin address' does " +
                    "not correspond to the administrator's address");
        });
}
function checkRegistration() {
    $("#checkRegistrationMessage").html("");

    const adminAddress = $("#adminAddress").val();
    const address = $("#address").val();

    simpleVoting.isAdministrator(adminAddress)
        .then (result => {
            if (result) {
                simpleVoting.isRegisteredVoter(address)
                    .then (result => {
                        if (result)
                            $("#checkRegistrationMessage").html("The voter has been registered");
                        else
                            $("#checkRegistrationMessage").html("The voter is NOT registered yet");
                    });
            }
            else
                $("#checkRegistrationMessage").html("The address in the 'Admin address' does " +
                    "not correspond to the administrator's address");
        });
}

function startProposalsRegistration() {
    $("#manageProposalsMessage").html("");

    const adminAddress = $("#adminAddress").val();

    simpleVoting.isAdministrator(adminAddress)
        .then (result => {
            if (result) {
                simpleVoting.getWorkflowStatus()
                    .then (workflowStatus => {
                        if (workflowStatus > 0)
                            $("#manageProposalsMessage").html("The proposals registration " +
                                "session has already been started");
                        else {
                            simpleVoting.startProposalsRegistration({
                                from : adminAddress,
                                gas : 200000,
                            }).then (() => {
                                $("#manageProposalsMessage").html("The proposals registration " +
                                    "session is started successfully");
                                refreshWorkflowStatus();
                            }).catch (e =>
                                $("#manageProposalsMessage").html(e)
                            );
                        }
                    });
            }
            else
                $("#manageProposalsMessage").html("The address in the 'Admin address' does " +
                    "not correspond to the administrator's address");
        });
}
function endProposalsRegistration() {
    $("#manageProposalsMessage").html("");

    const adminAddress = $("#adminAddress").val();

    simpleVoting.isAdministrator(adminAddress)
        .then (result => {
            if (result) {
                simpleVoting.getWorkflowStatus()
                    .then (workflowStatus => {
                        if (workflowStatus < 1)
                            $("#manageProposalsMessage").html("The proposals registration " +
                                "session has not been started yet");
                        else if (workflowStatus > 1)
                            $("#manageProposalsMessage").html("The proposals registration " +
                                "session has already been ended");
                        else {
                            simpleVoting.endProposalsRegistration({
                                from : adminAddress,
                                gas : 200000,
                            }).then (() => {
                                $("#manageProposalsMessage").html("The proposals registration " +
                                    "session is ended successfully");
                                refreshWorkflowStatus();
                            }).catch (e =>
                                $("#manageProposalsMessage").html(e)
                            );
                        }
                    });
            }
            else
                $("#manageProposalsMessage").html("The address in the 'Admin address' does " +
                    "not correspond to the administrator's address");
        });
}
function registerProposal() {
    $("#registerProposalMessage").html("");

    var voterAddress = $("#voterAddress").val();
    var proposalDescription = $("#proposalDescription").val();

    simpleVoting.isRegisteredVoter(voterAddress)
        .then (result => {
            if (result) {
                simpleVoting.getWorkflowStatus()
                    .then (workflowStatus => {
                        if (workflowStatus < 1)
                            $("#registerProposalMessage").html("The proposal " +
                                "registration session has not been started yet");
                        else if (workflowStatus > 1)
                            $("#registerProposalMessage").html("The proposal " +
                                "registration session has already been ended");
                        else {
                            simpleVoting.registerProposal(
                                proposalDescription,
                                {
                                    from : voterAddress,
                                    gas : 200000,
                                }
                            ).then (() => {
                                $("#registerProposalMessage").html("The proposal is " +
                                    "registered successfully");
                                loadProposalsTable();
                            });
                        }
                    });
            }
            else
                $("#registerProposalMessage").html("You are not a registered voter. " +
                    "You cannot register a proposal.");
        });
}
function loadProposalsTable() {
    simpleVoting.getProposalsNumber()
        .then (proposalsNumber => {
            var innerHtml = "<tr><td><b>Proposal Id</b></td><td><b>Description</b></td></tr>";

            j = 0;
            for (var i=0; i<proposalsNumber; i++) {
                getProposalDescription(i)
                    .then (description => {
                        innerHtml = innerHtml + "<tr><td>" + (j++) + "</td><td>" + description + "</td></tr>";
                        $("#proposalsTable").html(innerHtml);
                    });
            }
        });
}
function getProposalDescription(_proposalId) {
    return simpleVoting.getProposalDescription(_proposalId);
}

function startVotingSession() {
    $("#manageVotingMessage").html("");

    const adminAddress = $("#adminAddress").val();

    simpleVoting.isAdministrator(adminAddress)
        .then (result => {
            if (result) {
                simpleVoting.getWorkflowStatus()
                    .then (workflowStatus => {
                        if (workflowStatus < 2)
                            $("#manageVotingMessage").html("The proposals registration " +
                                "session has not been ended yet");
                        else if (workflowStatus > 2)
                            $("#manageVotingMessage").html("The voting session has " +
                                "already been started");
                        else {
                            simpleVoting.startVotingSession(
                                {
                                    from : adminAddress,
                                    gas : 200000,
                                }
                            ).then (() => {
                                $("#manageVotingMessage").html("The voting session " +
                                    "is started successfully");
                                refreshWorkflowStatus();
                            }).catch (e =>
                                $("#manageVotingMessage").html(e)
                            );
                        }
                    });
            }
            else
                $("#manageVotingMessage").html("The address in the 'Admin address' does " +
                    "not correspond to the administrator's address");
        });
}
function endVotingSession() {
    $("#manageVotingMessage").html("");

    const adminAddress = $("#adminAddress").val();

    simpleVoting.isAdministrator(adminAddress)
        .then (result => {
            if (result) {
                simpleVoting.getWorkflowStatus()
                    .then (workflowStatus => {
                        if (workflowStatus < 3)
                            $("#manageVotingMessage").html("The voting session has " +
                                "not been started yet");
                        else if (workflowStatus > 3)
                            $("#manageVotingMessage").html("The voting session has " +
                                "already been ended");
                        else {
                            simpleVoting.endVotingSession(
                                {
                                    from : adminAddress,
                                    gas : 200000,
                                }
                            ).then (() => {
                                $("#manageVotingMessage").html("The voting session " +
                                    "is ended successfully");
                                refreshWorkflowStatus();
                            }).catch (e =>
                                $("#manageVotingMessage").html(e)
                            );
                        }
                    });
            }
            else
                $("#manageVotingMessage").html("The address in the 'Admin address' does " +
                    "not correspond to the administrator's address");
        });
}
function vote() {
    $("#voteMessage").html("");

    var voterAddress = $("#voterAddress").val();
    var proposalId = $("#proposalId").val();

    simpleVoting.isRegisteredVoter(voterAddress)
        .then (result => {
            if (result) {
                simpleVoting.getWorkflowStatus()
                    .then (workflowStatus => {
                        if (workflowStatus < 3)
                            $("#voteMessage").html("The voting session has " +
                                "not been started yet");
                        else if (workflowStatus > 3)
                            $("#voteMessage").html("The voting session has " +
                                "already been ended");
                        else {
                            simpleVoting.getProposalsNumber()
                                .then (proposalsNumber => {
                                    if (proposalsNumber == 0)
                                        $("#voteMessage").html("There are not registered " +
                                            "proposals. You cannot vote.");
                                    else if (parseInt(proposalId) >= proposalsNumber)
                                        $("#voteMessage").html("The specified proposalId " +
                                            "does not exist.");
                                    else {
                                        simpleVoting.vote(
                                            proposalId,
                                            {
                                                from : voterAddress,
                                                gas : 200000,
                                            }
                                        ).then(result => {
                                            $("#voteMessage").html("Your vote is processed "+
                                                "successfully");
                                            console.log(result);
                                        }).catch (e => {
                                            $("#voteMessage").html(e);
                                            console.log(e);
                                        });
                                    }
                                });
                        }
                    });
            }
            else
                $("#voteMessage").html("The address in the 'Voter Address' is " +
                "not a registered address")
        });
}

function tallyVotes() {
    $("#tallyVotesMessage").html("");

    var adminAddress = $("#adminAddress").val();

    simpleVoting.isAdministrator(adminAddress)
        .then (result => {
            if (result) {
                simpleVoting.getWorkflowStatus()
                    .then (workflowStatus => {
                        if (workflowStatus < 4)
                            $("#tallyVotesMessage").html("The voting session has " +
                                "not been ended yet");
                        else if (workflowStatus > 4)
                            $("#tallyVotesMessage").html("The votes have already " +
                                "been tallied");
                        else {
                            simpleVoting.tallyVotes(
                                {
                                    from : adminAddress,
                                    gas : 200000,
                                }
                            ).then (() => {
                                $("#tallyVotesMessage").html("The votes are tallied " +
                                    "successfully");
                                refreshWorkflowStatus();
                                loadResultsTable();
                            }).catch (e =>
                                $("#tallyVotesMessage").html(e)
                            );
                        }
                    });
            }
            else
                $("#tallyVotesMessage").html("The address in the 'Admin address' does " +
                "not correspond to the administrator's address");
        });
}

function refreshWorkflowStatus() {
    simpleVoting.getWorkflowStatus()
        .then (workflowStatus => {
            let workflowStatusDescription;

            switch (workflowStatus.toString()) {
                case '0' :  workflowStatusDescription = "Registering voters";
                            break;
                case '1' :  workflowStatusDescription = "Proposals registration started";
                            break;
                case '2' :  workflowStatusDescription = "Proposals registration ended";
                            break;
                case '3' :  workflowStatusDescription = "Voting session started";
                            break;
                case '4' :  workflowStatusDescription = "Voting session ended";
                            break;
                case '5' :  workflowStatusDescription = "Votes have been tallied";
                            break;
                default :   workflowStatusDescription = "Unknown status";
            }

            $("#currentStatusMessage").html(workflowStatusDescription);
        });
}

function loadResultsTable() {
    simpleVoting.getWorkflowStatus()
        .then (workflowStatus => {
            if (workflowStatus == 5) {
                let innerHtml = "<tr><td><b>Winning Proposal</b></td><td></td></tr>";

                simpleVoting.getWinningProposalId()
                    .then (proposalId => {
                        innerHtml = innerHtml + "<tr><td><b>Id:</b></td><td>" +
                            proposalId + "</td></tr>";
                        
                            simpleVoting.getWinningProposalDescription()
                                .then (proposalDescription => {
                                    innerHtml = innerHtml + "<tr><td><b>Description:</b></td><td>" +
                                        proposalDescription + "</td></tr>";
                                    
                                    simpleVoting.getWinningProposalVoteCount()
                                        .then (proposalVoteCount => {
                                            innerHtml = innerHtml + "<tr><td><b>Vote count:</b></td><td>" +
                                                proposalVoteCount + "</td></tr";
                                            
                                            $("#resultsTable").html(innerHtml);
                                        });
                                });
                    });
            }
        });
}