<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Configurações do Banco de Dados (Preencha com seus dados do FreeWHA)
$host = "localhost"; // Geralmente localhost se o banco e site estão no mesmo servidor
$user = "SEU_USUARIO";
$pass = "SUA_SENHA";
$dbname = "NOME_DO_BANCO";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(["error" => "Conexão falhou: " . $e->getMessage()]));
}

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : (isset($_GET['path']) ? $_GET['path'] : '/');

// Roteamento Simples
if ($method == 'GET' && $path == '/health') {
    echo json_encode(["status" => "ok", "message" => "API PHP Conectada"]);
} 

elseif ($method == 'GET' && $path == '/materiais') {
    $stmt = $pdo->query("SELECT * FROM materiais ORDER BY data_atualizacao DESC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

elseif ($method == 'GET' && $path == '/stats') {
    $stmt = $pdo->query("SELECT situacao, COUNT(*) as total FROM materiais GROUP BY situacao");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

elseif ($method == 'POST' && $path == '/materiais') {
    $data = json_decode(file_get_contents('php://input'), true);
    $sql = "INSERT INTO materiais (setor, bmp, situacao, documento, descricao, categoria, quantidade) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['setor'], $data['bmp'], $data['situacao'], 
        $data['documento'], $data['descricao'], $data['categoria'], $data['quantidade'] ?? 1
    ]);
    echo json_encode(["id" => $pdo->lastInsertId(), "message" => "Criado"]);
}

elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = basename($path);
    $sql = "UPDATE materiais SET setor=?, bmp=?, situacao=?, documento=?, descricao=?, categoria=?, quantidade=? WHERE id=?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['setor'], $data['bmp'], $data['situacao'], 
        $data['documento'], $data['descricao'], $data['categoria'], $data['quantidade'], $id
    ]);
    echo json_encode(["message" => "Atualizado"]);
}

elseif ($method == 'DELETE') {
    $id = basename($path);
    $stmt = $pdo->prepare("DELETE FROM materiais WHERE id=?");
    $stmt->execute([$id]);
    echo json_encode(["message" => "Removido"]);
}
