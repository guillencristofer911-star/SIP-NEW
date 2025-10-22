-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 10-10-2025 a las 19:41:42
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `bd_sip`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `accion_moderacion`
--

CREATE TABLE `accion_moderacion` (
  `ID_accion_moderacion` int(100) NOT NULL,
  `accion` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cambio_contraseña`
--

CREATE TABLE `cambio_contraseña` (
  `ID_cambio` int(100) NOT NULL,
  `ID_usuario` int(100) NOT NULL,
  `fecha_cambio` date NOT NULL,
  `origen_cambio` varchar(100) NOT NULL,
  `IP_cambio` int(100) NOT NULL,
  `estado` varchar(100) NOT NULL,
  `observacion` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categoria`
--

CREATE TABLE `categoria` (
  `ID_categoria` int(100) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categoria`
--

INSERT INTO `categoria` (`ID_categoria`, `nombre`) VALUES
(1, 'Desarrollo de Software'),
(2, 'Redes y Telecomunicaciones'),
(3, 'Multimedia'),
(4, 'Otros');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comentario_proyecto`
--

CREATE TABLE `comentario_proyecto` (
  `ID_comentario` int(100) NOT NULL,
  `ID_proyecto` int(100) NOT NULL,
  `ID_usuario` int(100) NOT NULL,
  `contenido` varchar(100) NOT NULL,
  `fecha_creacion` date NOT NULL,
  `ID_estado_comentario` int(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contenido_afectado`
--

CREATE TABLE `contenido_afectado` (
  `ID_contenido_afectado` int(100) NOT NULL,
  `tipo` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_comentario`
--

CREATE TABLE `estado_comentario` (
  `ID_estado_comentario` int(100) NOT NULL,
  `estado` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_cuenta`
--

CREATE TABLE `estado_cuenta` (
  `ID_estado_cuenta` int(11) NOT NULL,
  `estado` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_cuenta`
--

INSERT INTO `estado_cuenta` (`ID_estado_cuenta`, `estado`) VALUES
(1, 'activo'),
(2, 'inactivo'),
(3, 'suspendido'),
(4, 'eliminado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_notificacion`
--

CREATE TABLE `estado_notificacion` (
  `ID_estado_notificacion` int(100) NOT NULL,
  `estado` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_proyecto`
--

CREATE TABLE `estado_proyecto` (
  `ID_estado_proyecto` int(100) NOT NULL,
  `estado` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_proyecto`
--

INSERT INTO `estado_proyecto` (`ID_estado_proyecto`, `estado`) VALUES
(1, 'activo'),
(2, 'inactivo'),
(3, 'pendiente'),
(4, 'rechazado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_publicacion`
--

CREATE TABLE `estado_publicacion` (
  `ID_estado_publicacion` int(100) NOT NULL,
  `estado` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_publicacion`
--

INSERT INTO `estado_publicacion` (`ID_estado_publicacion`, `estado`) VALUES
(1, 'activo'),
(2, 'inactivo'),
(3, 'pendiente'),
(4, 'rechazado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `etiqueta`
--

CREATE TABLE `etiqueta` (
  `ID_etiqueta` int(100) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `favorito_proyecto`
--

CREATE TABLE `favorito_proyecto` (
  `ID_fav_proyecto` int(100) NOT NULL,
  `ID_usuario` int(100) NOT NULL,
  `ID_proyecto` int(100) NOT NULL,
  `fecha_marcado` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `favorito_publicacion`
--

CREATE TABLE `favorito_publicacion` (
  `ID_fav` int(100) NOT NULL,
  `ID_usuario` int(100) NOT NULL,
  `ID_publicacion` int(100) NOT NULL,
  `fecha_marcado` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_moderación`
--

CREATE TABLE `historial_moderación` (
  `ID_historial` int(100) NOT NULL,
  `ID_usuario_accion` int(100) NOT NULL,
  `ID_accion_moderacion` int(100) NOT NULL,
  `ID_contenido_afectado` int(100) NOT NULL,
  `fecha_accion` date NOT NULL,
  `motivo` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `imagen_proyecto`
--

CREATE TABLE `imagen_proyecto` (
  `ID_imagen` int(100) NOT NULL,
  `ID_proyecto` int(100) NOT NULL,
  `URL_imagen` varchar(100) NOT NULL,
  `formato` varchar(100) NOT NULL,
  `peso` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificacion`
--

CREATE TABLE `notificacion` (
  `ID_notificacion` int(100) NOT NULL,
  `ID_usuario_destino` int(100) NOT NULL,
  `ID_tipo_publicacion` int(100) NOT NULL,
  `contenido` varchar(100) NOT NULL,
  `ID_estado_notificacion` int(100) NOT NULL,
  `fecha_envio` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `palabra_prohibida`
--

CREATE TABLE `palabra_prohibida` (
  `ID_palabra` int(100) NOT NULL,
  `palabra` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proyecto`
--

CREATE TABLE `proyecto` (
  `ID_proyecto` int(100) NOT NULL,
  `ID_usuario` int(100) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `enlaces` text DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_ultima_edicion` datetime NOT NULL,
  `ID_estado_proyecto` int(100) NOT NULL,
  `ID_categoria` int(100) NOT NULL,
  `github_url` varchar(255) DEFAULT NULL,
  `documento_pdf` varchar(255) DEFAULT NULL,
  `imagenes` text DEFAULT NULL,
  `rol_autor` varchar(50) DEFAULT NULL,
  `ID_rol_autor` int(11) DEFAULT NULL,
  `programa_autor` varchar(100) DEFAULT NULL,
  `estado` varchar(50) DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proyecto`
--

INSERT INTO `proyecto` (`ID_proyecto`, `ID_usuario`, `nombre`, `descripcion`, `enlaces`, `fecha_creacion`, `fecha_ultima_edicion`, `ID_estado_proyecto`, `ID_categoria`, `github_url`, `documento_pdf`, `imagenes`, `rol_autor`, `ID_rol_autor`, `programa_autor`, `estado`) VALUES
(1, 4, 'Esta es una prueba desde el usuario juan ', 'Esta es una prueba desde el usuario juan, con el ro egresado, test de edición', NULL, '2025-10-09 15:08:35', '2025-10-09 15:22:41', 1, 1, 'https://github.com/guillencristofer911-star/SIP-NEW', '/uploads/proyecto-1760040515565-702475636.pdf', '[\"/uploads/proyecto-1760040515564-309526274.png\",\"/uploads/proyecto-1760040515564-254911494.png\"]', 'egresado', 3, 'Desarrollo de Software', 'activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publicacion`
--

CREATE TABLE `publicacion` (
  `ID_publicacion` int(100) NOT NULL,
  `ID_usuario` int(100) NOT NULL,
  `ID_rol_autor` int(11) DEFAULT NULL,
  `titulo` varchar(100) NOT NULL,
  `contenido` text NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_ultima_edicion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ID_estado_publicacion` int(100) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `publicacion`
--

INSERT INTO `publicacion` (`ID_publicacion`, `ID_usuario`, `ID_rol_autor`, `titulo`, `contenido`, `fecha_creacion`, `fecha_ultima_edicion`, `ID_estado_publicacion`) VALUES
(1, 3, 2, 'Prueba de publicación', 'Este es un contenido de prueba', '2025-10-10 12:38:53', '2025-10-10 12:38:53', 1),
(2, 4, 3, 'testing editar publicaciones', 'este es un testing sobre editar publicaciones desde el usuario juan, aqui se debe editar por un nuevo texto', '2025-10-10 12:40:09', '2025-10-10 12:40:29', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publicacion_etiqueta`
--

CREATE TABLE `publicacion_etiqueta` (
  `ID_publicacion` int(100) NOT NULL,
  `ID_etiqueta` int(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recuperar_contrasena`
--

CREATE TABLE `recuperar_contrasena` (
  `ID_recuperacion` int(100) NOT NULL,
  `ID_usuario` int(100) NOT NULL,
  `token` text NOT NULL,
  `fecha_solicitud` date NOT NULL,
  `fecha_expiracion` date NOT NULL,
  `usado` date NOT NULL,
  `IP_solicitante` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `respuesta_publicacion`
--

CREATE TABLE `respuesta_publicacion` (
  `ID_respuesta` int(100) NOT NULL,
  `ID_publicacion` int(100) NOT NULL,
  `ID_usuario` int(100) NOT NULL,
  `contenido` varchar(100) NOT NULL,
  `fecha_creacion` int(100) NOT NULL,
  `fecha_ultima_edicion` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol`
--

CREATE TABLE `rol` (
  `ID_rol` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `rol`
--

INSERT INTO `rol` (`ID_rol`, `nombre`, `descripcion`) VALUES
(1, 'admin', 'Administrador del sistema'),
(2, 'aprendiz', 'Aprendiz SENA'),
(3, 'egresado', 'Egresado SENA');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_notificación`
--

CREATE TABLE `tipo_notificación` (
  `ID_tipo_notificacion` int(100) NOT NULL,
  `tipo` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `ID_usuario` int(11) NOT NULL,
  `documento` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `programa` varchar(100) NOT NULL,
  `ID_rol` int(11) NOT NULL DEFAULT 2,
  `contresena` varchar(255) NOT NULL,
  `imagen_perfil` varchar(255) DEFAULT NULL,
  `ID_estado_cuenta` int(11) NOT NULL DEFAULT 1,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`ID_usuario`, `documento`, `nombre`, `apellido`, `correo`, `programa`, `ID_rol`, `contresena`, `imagen_perfil`, `ID_estado_cuenta`, `fecha_registro`) VALUES
(3, '6092610', 'cristofer', 'guillen', 'rangelcristofer911@gmail.com', 'tps2 127', 2, '$2b$10$6mYPoCOyxxHCyWJTy62Ao.12xDz/rs3hg3YuEaOVwLaNp7O5lTxsa', NULL, 1, '2025-10-09 14:31:44'),
(4, '11223344', 'Juan', 'Garcia', 'JuanGarcia023@gmail.com', 'TPS2 123', 3, '$2b$10$CRn1U3amxY19.TmV5TQnJeA14042I1CnXPGrvdcTvgR1HJZYRwzJ.', NULL, 1, '2025-10-09 14:37:56');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `accion_moderacion`
--
ALTER TABLE `accion_moderacion`
  ADD PRIMARY KEY (`ID_accion_moderacion`);

--
-- Indices de la tabla `cambio_contraseña`
--
ALTER TABLE `cambio_contraseña`
  ADD PRIMARY KEY (`ID_cambio`),
  ADD KEY `ID_usuario` (`ID_usuario`);

--
-- Indices de la tabla `categoria`
--
ALTER TABLE `categoria`
  ADD PRIMARY KEY (`ID_categoria`);

--
-- Indices de la tabla `comentario_proyecto`
--
ALTER TABLE `comentario_proyecto`
  ADD PRIMARY KEY (`ID_comentario`),
  ADD KEY `ID_proyecto` (`ID_proyecto`,`ID_usuario`,`ID_estado_comentario`),
  ADD KEY `ID_usuario` (`ID_usuario`),
  ADD KEY `ID_estado_comentario` (`ID_estado_comentario`);

--
-- Indices de la tabla `contenido_afectado`
--
ALTER TABLE `contenido_afectado`
  ADD PRIMARY KEY (`ID_contenido_afectado`);

--
-- Indices de la tabla `estado_comentario`
--
ALTER TABLE `estado_comentario`
  ADD PRIMARY KEY (`ID_estado_comentario`);

--
-- Indices de la tabla `estado_cuenta`
--
ALTER TABLE `estado_cuenta`
  ADD PRIMARY KEY (`ID_estado_cuenta`);

--
-- Indices de la tabla `estado_notificacion`
--
ALTER TABLE `estado_notificacion`
  ADD PRIMARY KEY (`ID_estado_notificacion`);

--
-- Indices de la tabla `estado_proyecto`
--
ALTER TABLE `estado_proyecto`
  ADD PRIMARY KEY (`ID_estado_proyecto`);

--
-- Indices de la tabla `estado_publicacion`
--
ALTER TABLE `estado_publicacion`
  ADD PRIMARY KEY (`ID_estado_publicacion`);

--
-- Indices de la tabla `proyecto`
--
ALTER TABLE `proyecto`
  ADD PRIMARY KEY (`ID_proyecto`);

--
-- Indices de la tabla `publicacion`
--
ALTER TABLE `publicacion`
  ADD PRIMARY KEY (`ID_publicacion`),
  ADD KEY `ID_usuario` (`ID_usuario`),
  ADD KEY `ID_rol_autor` (`ID_rol_autor`),
  ADD KEY `ID_estado_publicacion` (`ID_estado_publicacion`);

--
-- Indices de la tabla `publicacion_etiqueta`
--
ALTER TABLE `publicacion_etiqueta`
  ADD PRIMARY KEY (`ID_publicacion`,`ID_etiqueta`);

--
-- Indices de la tabla `rol`
--
ALTER TABLE `rol`
  ADD PRIMARY KEY (`ID_rol`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`ID_usuario`),
  ADD UNIQUE KEY `documento` (`documento`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD KEY `ID_rol` (`ID_rol`),
  ADD KEY `ID_estado_cuenta` (`ID_estado_cuenta`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `estado_cuenta`
--
ALTER TABLE `estado_cuenta`
  MODIFY `ID_estado_cuenta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `estado_publicacion`
--
ALTER TABLE `estado_publicacion`
  MODIFY `ID_estado_publicacion` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `proyecto`
--
ALTER TABLE `proyecto`
  MODIFY `ID_proyecto` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `publicacion`
--
ALTER TABLE `publicacion`
  MODIFY `ID_publicacion` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `rol`
--
ALTER TABLE `rol`
  MODIFY `ID_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `ID_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`ID_rol`) REFERENCES `rol` (`ID_rol`) ON UPDATE CASCADE,
  ADD CONSTRAINT `usuario_ibfk_2` FOREIGN KEY (`ID_estado_cuenta`) REFERENCES `estado_cuenta` (`ID_estado_cuenta`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
