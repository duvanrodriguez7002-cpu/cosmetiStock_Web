<?php
header("Content-Type: application/json; charset=UTF-8");

require_once "conexion.php";

try {

    $accion = $_POST["accion"] ?? "";

    if ($_SERVER["REQUEST_METHOD"] === "POST") {

        $datos = json_decode(file_get_contents("php://input"), true);
        $accion = $datos["accion"] ?? "";
    }

    switch ($accion) {

        case "listar":

            $sql = "SELECT id, nombre FROM categorias ORDER BY nombre ASC";

            $resultado = mysqli_query($conexion, $sql);

            if (!$resultado) {
                throw new Exception(
                    "Error al consultar las categorías: " .
                    mysqli_error($conexion)
                );
            }

            $categorias = [];

            while ($fila = mysqli_fetch_assoc($resultado)) {
                $categorias[] = [
                    "id" => (int)$fila["id"],
                    "nombre" => $fila["nombre"]
                ];
            }

            echo json_encode([
                "ok" => true,
                "datos" => $categorias
            ]);

            break;

        default:

            echo json_encode([
                "ok" => false,
                "mensaje" => "Acción no válida."
            ]);

            break;
    }

} catch (Exception $e) {

    echo json_encode([
        "ok" => false,
        "mensaje" => $e->getMessage()
    ]);
}
?>