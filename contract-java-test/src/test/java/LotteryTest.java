import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.assertj.core.api.Assertions;

import com.partisiablockchain.BlockchainAddress;
import com.partisiablockchain.language.abicodegen.Lottery;
import com.partisiablockchain.language.abicodegen.Lottery.GameState;
import com.partisiablockchain.language.abicodegen.Lottery.GameStatusD;
import com.partisiablockchain.language.codegenlib.SecretInput;
import com.partisiablockchain.language.junit.ContractBytes;
import com.partisiablockchain.language.junit.ContractTest;
import com.partisiablockchain.language.junit.JunitContractTest;
import com.partisiablockchain.language.junit.exceptions.SecretInputFailureException;
import com.partisiablockchain.language.testenvironment.TxExecution;
import com.partisiablockchain.language.testenvironment.zk.node.task.PendingInputId;

final class LotteryTest extends JunitContractTest {

    private static final ContractBytes TRIVIA_CONTRACT = ContractBytes.fromPbcFile(
            Path.of("../rust/target/wasm32-unknown-unknown/release/lottery.pbc"),
            Path.of("../rust/target/wasm32-unknown-unknown/release/lottery_runner"));

    private static int MAX_ARR_LENGTH = 100;

    private BlockchainAddress deployer;
    private BlockchainAddress game;

    private BlockchainAddress creator1;
    private BlockchainAddress creator2;

    private BlockchainAddress player1;
    private BlockchainAddress player2;
    private BlockchainAddress player3;

    @ContractTest
    void deploy() {
        deployer = blockchain.newAccount(1);

        creator1 = blockchain.newAccount(2);
        creator2 = blockchain.newAccount(3);

        player1 = blockchain.newAccount(4);
        player2 = blockchain.newAccount(5);
        player3 = blockchain.newAccount(6);

        blockchain.waitForBlockProductionTime(System.currentTimeMillis());

        byte[] initRpc = Lottery.initialize();

        game = blockchain.deployZkContract(deployer, TRIVIA_CONTRACT, initRpc);

        assertNumberOfGames(0);

    }

    @ContractTest(previous = "deploy")
    void testCreateGame() {
        byte gameId = 0;
        byte questionCount = 100;
        // Set the deadline to 10 minutes from now (10 * 60 * 1000 milliseconds)
        long gameDeadline = System.currentTimeMillis() + (10 * 60 * 1000);

        createGame(
                creator1,
                gameId,
                questionCount,
                gameDeadline);

        assertNumberOfGames(1);
        assertGameIdIsTracked(gameId);

        Optional<GameState> _gameState = getGameState(gameId);

        Assertions.assertThat(_gameState).isPresent();

        GameState gameState = _gameState.get();

        Assertions.assertThat(gameState.creator()).isEqualTo(creator1);
        Assertions.assertThat(gameState.gameStatus().discriminant()).isEqualTo(GameStatusD.IN_PROGRESS);
        Assertions.assertThat(gameState.gameDeadline()).isEqualTo(gameDeadline);
        Assertions.assertThat(gameState.questionCount()).isEqualTo(questionCount);
        Assertions.assertThat(gameState.players().innerMap().size()).isEqualTo(0);
        Assertions.assertThat(gameState.gameDataSvar()).isNotNull();
        Assertions.assertThat(gameState.entriesSvars().size()).isEqualTo(0);
        Assertions.assertThat(gameState.leaderboard().size()).isEqualTo(0);

    }

    @ContractTest(previous = "testCreateGame")
    void testCreateGameWithUsedId() {
        byte gameId = 0;
        byte questionCount = 100;
        // Set the deadline to 10 minutes from now (10 * 60 * 1000 milliseconds)
        long gameDeadline = System.currentTimeMillis() + (10 * 60 * 1000);

        Assertions.assertThatThrownBy(() -> createGame(
                creator1,
                gameId,
                questionCount,
                gameDeadline)).isInstanceOf(SecretInputFailureException.class)
                .hasMessageContaining("game id already used");
    }

    @ContractTest(previous = "testCreateGame")
    void testCreateGameWithInvalidStartTime() {
        byte gameId = 99;
        byte questionCount = 100;
        // Set the deadline to 1 minute ago
        long gameDeadline = System.currentTimeMillis() - (100000 * 60 * 1000);

        Assertions.assertThatThrownBy(() -> createGame(
                creator1,
                gameId,
                questionCount,
                gameDeadline)).isInstanceOf(SecretInputFailureException.class)
                .hasMessageContaining("Game end must be in the future");
    }

    @ContractTest(previous = "testCreateGame")
    void testSubmitAnswers() {
        byte gameId = 0;

        assertGameIdIsTracked(gameId);

        submitAnswers(
                player1,
                gameId);

        Optional<GameState> _gameState = getGameState(gameId);

        Assertions.assertThat(_gameState).isPresent();

        GameState gameState = _gameState.get();

        Assertions.assertThat(gameState.players().innerMap().size()).isEqualTo(1);
        Assertions.assertThat(gameState.players().innerMap().get(player1)).isNotNull();
        Assertions.assertThat(gameState.entriesSvars().size()).isEqualTo(1);
    }

    @ContractTest(previous = "testSubmitAnswers")
    void testSubmitAnswersTwice() {
        byte gameId = 0;

        Assertions.assertThatThrownBy(() -> submitAnswers(
                player1,
                gameId)).isInstanceOf(SecretInputFailureException.class)
                .hasMessageContaining("Player already submitted");
    }

    @ContractTest(previous = "testSubmitAnswers")
    void testSubmitAnswersAsPlayer2() {
        byte gameId = 0;

        assertGameIdIsTracked(gameId);

        List<Byte> answers = new ArrayList<Byte>(Collections.nCopies(MAX_ARR_LENGTH, (byte) 0));

        answers.set(0, (byte) 1); // Q1 answer: 1
        answers.set(1, (byte) 6); // Q2 answer: 2 (incorrect)
        answers.set(2, (byte) 4); // Q3 answer: 3 (incorrect)

        submitAnswers(
                player2,
                gameId,
                answers);

        Optional<GameState> _gameState = getGameState(gameId);

        Assertions.assertThat(_gameState).isPresent();

        GameState gameState = _gameState.get();

        Assertions.assertThat(gameState.players().innerMap().size()).isEqualTo(2);
        Assertions.assertThat(gameState.players().innerMap().get(player2)).isNotNull();
        Assertions.assertThat(gameState.entriesSvars().size()).isEqualTo(2);
    }

    @ContractTest(previous = "testSubmitAnswersAsPlayer2")
    void testFinishGame() {
        byte gameId = 0;

        assertGameIdIsTracked(gameId);

        finishGame(
                creator1,
                gameId);

        Optional<GameState> _gameState = getGameState(gameId);

        Assertions.assertThat(_gameState).isPresent();
        // Assertions.assertthat(false).isEqualTo(true);

        GameState gameState = _gameState.get();

        Assertions.assertThat(gameState.gameStatus().discriminant()).isEqualTo(GameStatusD.COMPLETE);
    }

    private PendingInputId createGame(BlockchainAddress creator, byte id, byte count, long deadline,
            List<Byte> answers) {
        Lottery.GameInitParams params = new Lottery.GameInitParams(
                id,
                count,
                deadline);

        SecretInput input = Lottery.createGame(params).secretInput(answers);

        return blockchain.sendSecretInput(
                game,
                creator,
                input.secretInput(),
                input.publicRpc());
    }

    private PendingInputId createGame(BlockchainAddress creator, byte id, byte count, long deadline) {
        List<Byte> answers = new ArrayList<Byte>(Collections.nCopies(MAX_ARR_LENGTH, (byte) 0));

        answers.set(0, (byte) 1); // Q1 answer: 1
        answers.set(1, (byte) 2); // Q2 answer: 2
        answers.set(2, (byte) 3); // Q3 answer: 3

        return createGame(creator, id, count, deadline, answers);
    }

    private PendingInputId submitAnswers(BlockchainAddress player, byte id, List<Byte> answers) {
        SecretInput input = Lottery.submitAnswers(id).secretInput(answers);

        return blockchain.sendSecretInput(
                game,
                player,
                input.secretInput(),
                input.publicRpc());
    }

    private PendingInputId submitAnswers(BlockchainAddress player, byte id) {
        List<Byte> answers = new ArrayList<Byte>(Collections.nCopies(MAX_ARR_LENGTH, (byte) 0));

        answers.set(0, (byte) 1); // Q1 answer: 1
        answers.set(1, (byte) 2); // Q2 answer: 2
        answers.set(2, (byte) 3); // Q3 answer: 3

        return submitAnswers(player, id, answers);
    }

    private TxExecution finishGame(BlockchainAddress creator, byte id) {
        byte[] params = Lottery.finishGame(id);

        return blockchain.sendAction(creator, game, params);
    }

    private Lottery.ContractState getContractState() {
        return Lottery.deserializeState(
                blockchain.getContractState(game),
                getStateClient(),
                game);
        // return Lottery.ContractState.deserialize(blockchain.getContractState(game),
        // getStateClient());
    }

    private void assertNumberOfGames(int expectedNumber) {
        Assertions.assertThat(getContractState().games().size()).isEqualTo(expectedNumber);
    }

    private void assertGameIdIsTracked(byte gameId) {
        Assertions.assertThat(
                getContractState().gameIds().innerMap().get(gameId)).isNotNull();
    }

    private Optional<GameState> getGameState(byte gameId) {
        Lottery.ContractState state = getContractState();

        return state.games()
                .stream()
                .filter(game -> game.gameId() == gameId)
                .findFirst();
    }
}