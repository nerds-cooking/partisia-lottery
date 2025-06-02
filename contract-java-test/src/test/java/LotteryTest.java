import java.math.BigInteger;
import java.nio.file.Path;

import org.assertj.core.api.Assertions;

import com.partisiablockchain.BlockchainAddress;
import com.partisiablockchain.language.abicodegen.Lottery;
import com.partisiablockchain.language.abicodegen.Lottery.AccountSecret;
// import com.partisiablockchain.language.abicodegen.Lottery.LotteryState;
import com.partisiablockchain.language.abicodegen.Testtoken;
import com.partisiablockchain.language.abicodegen.Testtoken.TokenState;
import com.partisiablockchain.language.codegenlib.SecretInput;
import com.partisiablockchain.language.junit.ContractBytes;
import com.partisiablockchain.language.junit.ContractTest;
import com.partisiablockchain.language.junit.JunitContractTest;
import com.partisiablockchain.language.testenvironment.zk.node.task.PendingInputId;

final class LotteryTest extends JunitContractTest {
        // Contract paths
        private static final ContractBytes LOTTERY_CONTRACT = ContractBytes.fromPbcFile(
                        Path.of("../rust/target/wasm32-unknown-unknown/release/lottery.pbc"),
                        Path.of("../rust/target/wasm32-unknown-unknown/release/lottery_runner"));

        private static final ContractBytes TOKEN_CONTRACT = ContractBytes.fromPbcFile(
                        Path.of("../rust/target/wasm32-unknown-unknown/release/testtoken.pbc"),
                        Path.of("../rust/target/wasm32-unknown-unknown/release/testtoken_runner"));

        // Constants
        private static final int DECIMALS = 18;
        private static final BigInteger INITIAL_TOKEN_SUPPLY = toBigInteger(100000);
        private static final BigInteger PLAYER_INITIAL_BALANCE = toBigInteger(1000);
        private static final BigInteger LOTTERY_ENTRY_COST = toBigInteger(100);
        private static final byte DEFAULT_LOTTERY_ID = 0;
        private static final long LOTTERY_DURATION_MS = 10 * 60 * 1000; // 10 minutes

        // Accounts
        private BlockchainAddress deployer;
        private BlockchainAddress lottery;
        private BlockchainAddress token;
        private BlockchainAddress creator;
        private BlockchainAddress player1;
        private BlockchainAddress player2;
        private BlockchainAddress player3;
        private BlockchainAddress feesRecipient;

        // Test state
        private long lotteryDeadline;

        @ContractTest
        void setupEnvironment() {
                createAccounts();
                deployContracts();
                setupTokenDistribution();
                // assertNumberOfLotteries(0);
        }

        @ContractTest(previous = "setupEnvironment")
        void testCreateSecretAccount() {
                // Create a secret account for the creator
                
                long accountKey = 716473264414L;
                PendingInputId inputId = createSecretAccount(accountKey);

                // Verify the secret account creation
                // assertNumberOfLotteries(0); // No lottery created yet
        }



        // @ContractTest(previous = "setupEnvironment")
        // void testCreateLottery() {
        //         // Create a new lottery
        //         createDefaultLottery();

        //         // Verify lottery creation
        //         assertNumberOfLotteries(1);
        //         assertLotteryIdIsTracked(DEFAULT_LOTTERY_ID);
        //         assertLotteryState(DEFAULT_LOTTERY_ID, state -> {
        //                 Assertions.assertThat(state.creator()).isEqualTo(creator);
        //                 Assertions.assertThat(state.deadline()).isEqualTo(lotteryDeadline);
        //                 Assertions.assertThat(state.entryCost()).isEqualTo(LOTTERY_ENTRY_COST);
        //                 Assertions.assertThat(state.entriesSvars().size()).isEqualTo(0);
        //                 Assertions.assertThat(state.entryCounts().size()).isEqualTo(0);
        //                 Assertions.assertThat(state.status().discriminant()).isEqualTo(LotteryStatusD.OPEN);
        //                 Assertions.assertThat(state.tokenAddress()).isEqualTo(token);
        //                 Assertions.assertThat(state.winner()).isNull();
        //                 Assertions.assertThat(state.prizePool()).isEqualTo(BigInteger.ZERO);
        //         });
        // }

        // @ContractTest(previous = "testCreateLottery")
        // void testSinglePlayerEntries() {
        //         // Player 1 enters the lottery
        //         BigInteger initialBalance = balance(player1);
        //         enterLottery(player1, DEFAULT_LOTTERY_ID);

        //         // Verify first entry
        //         assertLotteryState(DEFAULT_LOTTERY_ID, state -> {
        //                 Assertions.assertThat(state.entryCounts().get(player1)).isEqualTo(1);
        //                 Assertions.assertThat(state.entriesSvars().size()).isEqualTo(1);
        //                 Assertions.assertThat(state.entryCounts().size()).isEqualTo(1);
        //                 Assertions.assertThat(state.prizePool()).isEqualTo(LOTTERY_ENTRY_COST);
        //         });

        //         // Verify token balances
        //         Assertions.assertThat(balance(player1)).isEqualTo(initialBalance.subtract(LOTTERY_ENTRY_COST));
        //         Assertions.assertThat(balance(lottery)).isEqualTo(LOTTERY_ENTRY_COST);

        //         // Player 1 enters again
        //         enterLottery(player1, DEFAULT_LOTTERY_ID);

        //         // Verify second entry
        //         assertLotteryState(DEFAULT_LOTTERY_ID, state -> {
        //                 Assertions.assertThat(state.entryCounts().get(player1)).isEqualTo(2);
        //                 Assertions.assertThat(state.entriesSvars().size()).isEqualTo(2);
        //                 Assertions.assertThat(state.entryCounts().size()).isEqualTo(1);
        //                 Assertions.assertThat(state.prizePool())
        //                                 .isEqualTo(LOTTERY_ENTRY_COST.multiply(BigInteger.valueOf(2)));
        //         });

        //         // Verify updated token balances
        //         Assertions.assertThat(balance(player1))
        //                         .isEqualTo(initialBalance.subtract(LOTTERY_ENTRY_COST.multiply(BigInteger.valueOf(2))));
        //         Assertions.assertThat(balance(lottery)).isEqualTo(LOTTERY_ENTRY_COST.multiply(BigInteger.valueOf(2)));
        // }

        // @ContractTest(previous = "testSinglePlayerEntries")
        // void testMultiplePlayerEntries() {
        //         // Player 2 enters the lottery
        //         BigInteger initialBalance = balance(player2);
        //         enterLottery(player2, DEFAULT_LOTTERY_ID);

        //         // Verify entry
        //         assertLotteryState(DEFAULT_LOTTERY_ID, state -> {
        //                 Assertions.assertThat(state.entryCounts().get(player2)).isEqualTo(1);
        //                 Assertions.assertThat(state.entriesSvars().size()).isEqualTo(3);
        //                 Assertions.assertThat(state.entryCounts().size()).isEqualTo(2);
        //                 Assertions.assertThat(state.prizePool())
        //                                 .isEqualTo(LOTTERY_ENTRY_COST.multiply(BigInteger.valueOf(3)));
        //         });

        //         // Verify token balances
        //         Assertions.assertThat(balance(player2)).isEqualTo(initialBalance.subtract(LOTTERY_ENTRY_COST));
        //         Assertions.assertThat(balance(lottery)).isEqualTo(LOTTERY_ENTRY_COST.multiply(BigInteger.valueOf(3)));
        // }

        // @ContractTest(previous = "testMultiplePlayerEntries")
        // void testDrawLottery() {
        //         // Draw the lottery
        //         drawLottery(creator, DEFAULT_LOTTERY_ID);

        //         // Verify lottery results
        //         assertLotteryState(DEFAULT_LOTTERY_ID, state -> {
        //                 Assertions.assertThat(state.winner()).isNotNull();
        //                 Assertions.assertThat(state.winner()).isIn(player1, player2);
        //                 Assertions.assertThat(state.status().discriminant()).isEqualTo(LotteryStatusD.COMPLETE);
        //         });
        // }

        // Helper methods for setup
        private void createAccounts() {
                deployer = blockchain.newAccount(1);
                creator = blockchain.newAccount(2);
                player1 = blockchain.newAccount(3);
                player2 = blockchain.newAccount(4);
                player3 = blockchain.newAccount(5);
                feesRecipient = blockchain.newAccount(6);

                blockchain.waitForBlockProductionTime(System.currentTimeMillis());
        }

        private void deployContracts() {
                // Deploy token contract
                byte[] initTokenRpc = Testtoken.initialize("TestToken", "TT", (byte) DECIMALS, INITIAL_TOKEN_SUPPLY);
                token = blockchain.deployContract(deployer, TOKEN_CONTRACT, initTokenRpc);

                // Deploy lottery contract
                byte[] initLotteryRpc = Lottery.initialize();
                lottery = blockchain.deployZkContract(deployer, LOTTERY_CONTRACT, initLotteryRpc);
        }

        private void setupTokenDistribution() {
                // Transfer tokens to players
                transferTokens(deployer, player1, PLAYER_INITIAL_BALANCE);
                transferTokens(deployer, player2, PLAYER_INITIAL_BALANCE);

                // Verify balances
                Assertions.assertThat(balance(deployer)).isEqualTo(
                                INITIAL_TOKEN_SUPPLY.subtract(PLAYER_INITIAL_BALANCE.multiply(BigInteger.valueOf(2))));
                Assertions.assertThat(balance(player1)).isEqualTo(PLAYER_INITIAL_BALANCE);
                Assertions.assertThat(balance(player2)).isEqualTo(PLAYER_INITIAL_BALANCE);

                // Set approvals for lottery contract
                approveTokens(player1, lottery, PLAYER_INITIAL_BALANCE);
                approveTokens(player2, lottery, PLAYER_INITIAL_BALANCE);

                // Verify approvals
                Assertions.assertThat(allowance(player1, lottery)).isEqualTo(PLAYER_INITIAL_BALANCE);
                Assertions.assertThat(allowance(player2, lottery)).isEqualTo(PLAYER_INITIAL_BALANCE);
        }

        private PendingInputId createSecretAccount(long accountKey) {

                SecretInput input = Lottery.createAccount().secretInput(
                        new AccountSecret(accountKey)
                );

                return blockchain.sendSecretInput(
                                lottery,
                                creator,
                                input.secretInput(),
                                input.publicRpc());

        }

        // private void createDefaultLottery() {
        //         lotteryDeadline = System.currentTimeMillis() + LOTTERY_DURATION_MS;
        //         createLottery(creator, DEFAULT_LOTTERY_ID, lotteryDeadline, token, LOTTERY_ENTRY_COST);
        // }

        // // Lottery contract interaction helpers
        // private PendingInputId enterLottery(BlockchainAddress player, byte lotteryId) {
        //         List<Byte> inputData = new ArrayList<>(Collections.nCopies(100, (byte) 0));
        //         EntryParams entryParams = new EntryParams(lotteryId);
        //         SecretInput input = Lottery.submitEntry(entryParams).secretInput(inputData);

        //         return blockchain.sendSecretInput(
        //                         lottery,
        //                         player,
        //                         input.secretInput(),
        //                         input.publicRpc());
        // }

        // private TxExecution createLottery(BlockchainAddress creator, byte id, long deadline,
        //                 BlockchainAddress tokenAddress, BigInteger entryCost) {
        //         Lottery.LotteryInitParams params = new Lottery.LotteryInitParams(
        //                         id, deadline, tokenAddress, entryCost, creator);
        //         byte[] action = Lottery.newLottery(params);
        //         return blockchain.sendAction(creator, lottery, action);
        // }

        // private TxExecution drawLottery(BlockchainAddress creator, byte id) {
        //         byte[] action = Lottery.drawLottery(id);
        //         return blockchain.sendAction(creator, lottery, action);
        // }

        // Token contract interaction helpers
        private void transferTokens(BlockchainAddress from, BlockchainAddress to, BigInteger amount) {
                blockchain.sendAction(from, token, Testtoken.transfer(to, amount));
        }

        private void approveTokens(BlockchainAddress approver, BlockchainAddress spender, BigInteger amount) {
                blockchain.sendAction(approver, token, Testtoken.approve(spender, amount));
        }

        // State accessor helpers
        // private Lottery.ContractState getLotteryContractState() {
        //         return Lottery.deserializeState(
        //                         blockchain.getContractState(lottery),
        //                         getStateClient(),
        //                         lottery);
        // }

        // private Optional<LotteryState> getLotteryState(byte lotteryId) {
        //         return getLotteryContractState().lotteries()
        //                         .stream()
        //                         .filter(lottery -> lottery.lotteryId() == lotteryId)
        //                         .findFirst();
        // }

        private TokenState getTokenState() {
                return Testtoken.deserializeState(
                                blockchain.getContractState(token),
                                getStateClient(),
                                token);
        }

        private BigInteger balance(final BlockchainAddress owner) {
                TokenState state = getTokenState();
                BigInteger balance = state.balances().get(owner);
                return balance == null ? BigInteger.ZERO : balance;
        }

        private BigInteger allowance(final BlockchainAddress owner, final BlockchainAddress spender) {
                TokenState state = getTokenState();
                Testtoken.AllowedAddress allowed = new Testtoken.AllowedAddress(owner, spender);
                BigInteger allowance = state.allowed().get(allowed);
                return allowance == null ? BigInteger.ZERO : allowance;
        }

        // Assertion helpers
        // private void assertLotteryIdIsTracked(byte lotteryId) {
        //         Assertions.assertThat(
        //                         getLotteryContractState().lotteryIds().innerMap().get(lotteryId)).isNotNull();
        // }

        // private void assertNumberOfLotteries(int expectedNumber) {
        //         Assertions.assertThat(getLotteryContractState().lotteries().size()).isEqualTo(expectedNumber);
        // }

        // private void assertLotteryState(byte lotteryId, java.util.function.Consumer<LotteryState> assertions) {
        //         Optional<LotteryState> stateOpt = getLotteryState(lotteryId);
        //         Assertions.assertThat(stateOpt).isPresent();
        //         assertions.accept(stateOpt.get());
        // }

        // Utility methods
        private static BigInteger toBigInteger(long number) {
                return BigInteger.valueOf(number).multiply(BigInteger.TEN.pow(DECIMALS));
        }
}