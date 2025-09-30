-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 30-09-2025 a las 16:59:12
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
  `ID_estado_cuenta` int(100) NOT NULL,
  `Estado` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_publicacion`
--

CREATE TABLE `estado_publicacion` (
  `ID_publicacion` int(100) NOT NULL,
  `estado` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `descripcion` varchar(100) NOT NULL,
  `enlaces` varchar(100) NOT NULL,
  `fecha_creacion` date NOT NULL,
  `fecha_ultima_edicion` date NOT NULL,
  `ID_estado_proyecto` int(100) NOT NULL,
  `ID_categoria` int(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publicacion`
--

CREATE TABLE `publicacion` (
  `ID_publicacion` int(100) NOT NULL,
  `ID_usuario` int(100) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `contenido` varchar(100) NOT NULL,
  `fecha_creacion` date NOT NULL,
  `fecha_ultima_edicion` date NOT NULL,
  `ID_estado_publicacion` int(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `ID_Rol` int(100) NOT NULL,
  `Nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `ID_usuario` int(100) NOT NULL,
  `documento` int(15) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `programa` varchar(100) NOT NULL,
  `ID_rol` int(11) DEFAULT NULL,
  `contresena` varchar(100) NOT NULL,
  `imagen perfil` varbinary(100) NOT NULL,
  `ID_estado_cuenta` int(100) NOT NULL,
  `fecha_registro` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`ID_usuario`, `documento`, `nombre`, `apellido`, `correo`, `programa`, `ID_rol`, `contresena`, `imagen perfil`, `ID_estado_cuenta`, `fecha_registro`) VALUES
(15, 6092610, 'cristofer', 'guillen', 'rangelcristofer911@gmail.com', 'tps2', 2, '$2b$10$a7g//D/xpmLEozvj6rWWhuzJ.N1syLK7VvtzxPYNaVBT5uN5sm4TG', '', 1, '0000-00-00');

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
  ADD PRIMARY KEY (`ID_publicacion`);

--
-- Indices de la tabla `etiqueta`
--
ALTER TABLE `etiqueta`
  ADD PRIMARY KEY (`ID_etiqueta`);

--
-- Indices de la tabla `favorito_proyecto`
--
ALTER TABLE `favorito_proyecto`
  ADD PRIMARY KEY (`ID_fav_proyecto`),
  ADD KEY `ID_usuario` (`ID_usuario`,`ID_proyecto`),
  ADD KEY `ID_proyecto` (`ID_proyecto`);

--
-- Indices de la tabla `favorito_publicacion`
--
ALTER TABLE `favorito_publicacion`
  ADD PRIMARY KEY (`ID_fav`),
  ADD KEY `ID_usuario` (`ID_usuario`,`ID_publicacion`),
  ADD KEY `ID_publicacion` (`ID_publicacion`);

--
-- Indices de la tabla `historial_moderación`
--
ALTER TABLE `historial_moderación`
  ADD PRIMARY KEY (`ID_historial`),
  ADD KEY `ID_usuario_accion` (`ID_usuario_accion`,`ID_accion_moderacion`,`ID_contenido_afectado`),
  ADD KEY `ID_contenido_afectado` (`ID_contenido_afectado`),
  ADD KEY `ID_accion_moderacion` (`ID_accion_moderacion`);

--
-- Indices de la tabla `imagen_proyecto`
--
ALTER TABLE `imagen_proyecto`
  ADD PRIMARY KEY (`ID_imagen`),
  ADD KEY `ID_proyecto` (`ID_proyecto`);

--
-- Indices de la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD PRIMARY KEY (`ID_notificacion`),
  ADD KEY `ID_usuario_destino` (`ID_usuario_destino`,`ID_tipo_publicacion`,`ID_estado_notificacion`),
  ADD KEY `ID_tipo_publicacion` (`ID_tipo_publicacion`),
  ADD KEY `ID_estado_notificacion` (`ID_estado_notificacion`);

--
-- Indices de la tabla `palabra_prohibida`
--
ALTER TABLE `palabra_prohibida`
  ADD PRIMARY KEY (`ID_palabra`);

--
-- Indices de la tabla `proyecto`
--
ALTER TABLE `proyecto`
  ADD PRIMARY KEY (`ID_proyecto`),
  ADD KEY `ID_usuario` (`ID_usuario`,`ID_estado_proyecto`,`ID_categoria`),
  ADD KEY `ID_estado_proyecto` (`ID_estado_proyecto`),
  ADD KEY `ID_categoria` (`ID_categoria`);

--
-- Indices de la tabla `publicacion`
--
ALTER TABLE `publicacion`
  ADD PRIMARY KEY (`ID_publicacion`),
  ADD KEY `ID_usuario` (`ID_usuario`),
  ADD KEY `ID_estado_publicacion` (`ID_estado_publicacion`);

--
-- Indices de la tabla `publicacion_etiqueta`
--
ALTER TABLE `publicacion_etiqueta`
  ADD PRIMARY KEY (`ID_publicacion`),
  ADD KEY `ID_etiqueta` (`ID_etiqueta`);

--
-- Indices de la tabla `recuperar_contrasena`
--
ALTER TABLE `recuperar_contrasena`
  ADD PRIMARY KEY (`ID_recuperacion`),
  ADD KEY `ID_usuario` (`ID_usuario`);

--
-- Indices de la tabla `respuesta_publicacion`
--
ALTER TABLE `respuesta_publicacion`
  ADD PRIMARY KEY (`ID_respuesta`),
  ADD KEY `ID_publicacion` (`ID_publicacion`,`ID_usuario`),
  ADD KEY `ID_usuario` (`ID_usuario`);

--
-- Indices de la tabla `rol`
--
ALTER TABLE `rol`
  ADD PRIMARY KEY (`ID_Rol`);

--
-- Indices de la tabla `tipo_notificación`
--
ALTER TABLE `tipo_notificación`
  ADD PRIMARY KEY (`ID_tipo_notificacion`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`ID_usuario`),
  ADD KEY `ID_rol` (`ID_rol`),
  ADD KEY `ID_estado_cuenta` (`ID_estado_cuenta`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `accion_moderacion`
--
ALTER TABLE `accion_moderacion`
  MODIFY `ID_accion_moderacion` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cambio_contraseña`
--
ALTER TABLE `cambio_contraseña`
  MODIFY `ID_cambio` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categoria`
--
ALTER TABLE `categoria`
  MODIFY `ID_categoria` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comentario_proyecto`
--
ALTER TABLE `comentario_proyecto`
  MODIFY `ID_comentario` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `contenido_afectado`
--
ALTER TABLE `contenido_afectado`
  MODIFY `ID_contenido_afectado` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estado_comentario`
--
ALTER TABLE `estado_comentario`
  MODIFY `ID_estado_comentario` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estado_cuenta`
--
ALTER TABLE `estado_cuenta`
  MODIFY `ID_estado_cuenta` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estado_notificacion`
--
ALTER TABLE `estado_notificacion`
  MODIFY `ID_estado_notificacion` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estado_proyecto`
--
ALTER TABLE `estado_proyecto`
  MODIFY `ID_estado_proyecto` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estado_publicacion`
--
ALTER TABLE `estado_publicacion`
  MODIFY `ID_publicacion` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `etiqueta`
--
ALTER TABLE `etiqueta`
  MODIFY `ID_etiqueta` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `favorito_proyecto`
--
ALTER TABLE `favorito_proyecto`
  MODIFY `ID_fav_proyecto` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `favorito_publicacion`
--
ALTER TABLE `favorito_publicacion`
  MODIFY `ID_fav` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `historial_moderación`
--
ALTER TABLE `historial_moderación`
  MODIFY `ID_historial` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `imagen_proyecto`
--
ALTER TABLE `imagen_proyecto`
  MODIFY `ID_imagen` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `notificacion`
--
ALTER TABLE `notificacion`
  MODIFY `ID_notificacion` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `palabra_prohibida`
--
ALTER TABLE `palabra_prohibida`
  MODIFY `ID_palabra` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proyecto`
--
ALTER TABLE `proyecto`
  MODIFY `ID_proyecto` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `publicacion`
--
ALTER TABLE `publicacion`
  MODIFY `ID_publicacion` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `publicacion_etiqueta`
--
ALTER TABLE `publicacion_etiqueta`
  MODIFY `ID_publicacion` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `recuperar_contrasena`
--
ALTER TABLE `recuperar_contrasena`
  MODIFY `ID_recuperacion` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `respuesta_publicacion`
--
ALTER TABLE `respuesta_publicacion`
  MODIFY `ID_respuesta` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `rol`
--
ALTER TABLE `rol`
  MODIFY `ID_Rol` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tipo_notificación`
--
ALTER TABLE `tipo_notificación`
  MODIFY `ID_tipo_notificacion` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `ID_usuario` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `cambio_contraseña`
--
ALTER TABLE `cambio_contraseña`
  ADD CONSTRAINT `cambio_contraseña_ibfk_1` FOREIGN KEY (`ID_usuario`) REFERENCES `usuario` (`ID_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `comentario_proyecto`
--
ALTER TABLE `comentario_proyecto`
  ADD CONSTRAINT `comentario_proyecto_ibfk_1` FOREIGN KEY (`ID_proyecto`) REFERENCES `proyecto` (`ID_proyecto`) ON UPDATE CASCADE,
  ADD CONSTRAINT `comentario_proyecto_ibfk_2` FOREIGN KEY (`ID_usuario`) REFERENCES `usuario` (`ID_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `comentario_proyecto_ibfk_3` FOREIGN KEY (`ID_estado_comentario`) REFERENCES `estado_comentario` (`ID_estado_comentario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `favorito_proyecto`
--
ALTER TABLE `favorito_proyecto`
  ADD CONSTRAINT `favorito_proyecto_ibfk_1` FOREIGN KEY (`ID_proyecto`) REFERENCES `proyecto` (`ID_proyecto`) ON UPDATE CASCADE,
  ADD CONSTRAINT `favorito_proyecto_ibfk_2` FOREIGN KEY (`ID_usuario`) REFERENCES `usuario` (`ID_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `favorito_publicacion`
--
ALTER TABLE `favorito_publicacion`
  ADD CONSTRAINT `favorito_publicacion_ibfk_1` FOREIGN KEY (`ID_usuario`) REFERENCES `usuario` (`ID_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `favorito_publicacion_ibfk_2` FOREIGN KEY (`ID_publicacion`) REFERENCES `publicacion` (`ID_publicacion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `historial_moderación`
--
ALTER TABLE `historial_moderación`
  ADD CONSTRAINT `historial_moderación_ibfk_1` FOREIGN KEY (`ID_contenido_afectado`) REFERENCES `contenido_afectado` (`ID_contenido_afectado`) ON UPDATE CASCADE,
  ADD CONSTRAINT `historial_moderación_ibfk_2` FOREIGN KEY (`ID_usuario_accion`) REFERENCES `usuario` (`ID_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `historial_moderación_ibfk_3` FOREIGN KEY (`ID_accion_moderacion`) REFERENCES `accion_moderacion` (`ID_accion_moderacion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `imagen_proyecto`
--
ALTER TABLE `imagen_proyecto`
  ADD CONSTRAINT `imagen_proyecto_ibfk_1` FOREIGN KEY (`ID_proyecto`) REFERENCES `proyecto` (`ID_proyecto`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD CONSTRAINT `notificacion_ibfk_1` FOREIGN KEY (`ID_usuario_destino`) REFERENCES `usuario` (`ID_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `notificacion_ibfk_2` FOREIGN KEY (`ID_tipo_publicacion`) REFERENCES `categoria` (`ID_categoria`) ON UPDATE CASCADE,
  ADD CONSTRAINT `notificacion_ibfk_3` FOREIGN KEY (`ID_estado_notificacion`) REFERENCES `estado_proyecto` (`ID_estado_proyecto`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `proyecto`
--
ALTER TABLE `proyecto`
  ADD CONSTRAINT `proyecto_ibfk_1` FOREIGN KEY (`ID_usuario`) REFERENCES `usuario` (`ID_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `proyecto_ibfk_2` FOREIGN KEY (`ID_estado_proyecto`) REFERENCES `estado_proyecto` (`ID_estado_proyecto`) ON UPDATE CASCADE,
  ADD CONSTRAINT `proyecto_ibfk_3` FOREIGN KEY (`ID_categoria`) REFERENCES `categoria` (`ID_categoria`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `publicacion`
--
ALTER TABLE `publicacion`
  ADD CONSTRAINT `publicacion_ibfk_1` FOREIGN KEY (`ID_estado_publicacion`) REFERENCES `estado_publicacion` (`ID_publicacion`) ON UPDATE CASCADE,
  ADD CONSTRAINT `publicacion_ibfk_2` FOREIGN KEY (`ID_usuario`) REFERENCES `usuario` (`ID_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `publicacion_ibfk_3` FOREIGN KEY (`ID_publicacion`) REFERENCES `respuesta_publicacion` (`ID_publicacion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `publicacion_etiqueta`
--
ALTER TABLE `publicacion_etiqueta`
  ADD CONSTRAINT `publicacion_etiqueta_ibfk_1` FOREIGN KEY (`ID_etiqueta`) REFERENCES `etiqueta` (`ID_etiqueta`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `recuperar_contrasena`
--
ALTER TABLE `recuperar_contrasena`
  ADD CONSTRAINT `recuperar_contrasena_ibfk_1` FOREIGN KEY (`ID_usuario`) REFERENCES `usuario` (`ID_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `respuesta_publicacion`
--
ALTER TABLE `respuesta_publicacion`
  ADD CONSTRAINT `respuesta_publicacion_ibfk_1` FOREIGN KEY (`ID_usuario`) REFERENCES `usuario` (`ID_usuario`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
