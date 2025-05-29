using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.ApplicationInsights;
using Backendapi.Controllers;
using Backendapi.Data;
using Backendapi.Models;
using NUnit.Framework;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace Backendapi.Tests.Controllers
{
    [TestFixture]
    public class AuthControllerTests
    {
        private AppDbContext _context;
        private IConfiguration _configuration;
        private TelemetryClient _telemetryClient;
        private AuthController _controller;

        [SetUp]
        public void Setup()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new AppDbContext(options);

            // Setup configuration
            var configValues = new Dictionary<string, string>
            {
                {"Jwt:Key", "your-512-bit-secret-key-here-must-be-at-least-64-bytes-long-for-hmac-sha512-algorithm"},
                {"Jwt:Issuer", "test-issuer"},
                {"Jwt:Audience", "test-audience"}
            };
            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configValues)
                .Build();

            // Setup telemetry client
            _telemetryClient = new TelemetryClient();

            // Create controller instance
            _controller = new AuthController(_context, _configuration, _telemetryClient);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Test]
        public async Task Register_WithValidData_ReturnsOkResult()
        {
            // Arrange
            var userDto = new UserDto
            {
                Name = "Test User",
                Email = "test@example.com",
                Password = "TestPassword123!",
                Role = "User"
            };

            // Act
            var result = await _controller.Register(userDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult.Value, Is.EqualTo("User registered successfully"));
        }

        [Test]
        public async Task Register_WithExistingEmail_ReturnsBadRequest()
        {
            // Arrange
            var existingUser = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Existing User",
                Email = "existing@example.com",
                Role = "User",
                PasswordHash = "hash",
                PasswordSalt = "salt"
            };
            await _context.Users.AddAsync(existingUser);
            await _context.SaveChangesAsync();

            var userDto = new UserDto
            {
                Name = "New User",
                Email = "existing@example.com",
                Password = "TestPassword123!",
                Role = "User"
            };

            // Act
            var result = await _controller.Register(userDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result.Result as BadRequestObjectResult;
            Assert.That(badRequestResult.Value, Is.EqualTo("User already exists"));
        }

        [Test]
        public async Task Login_WithValidCredentials_ReturnsOkWithToken()
        {
            // Arrange
            string password = "TestPassword123!";
            CreatePasswordHash(password, out byte[] passwordHash, out byte[] passwordSalt);

            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Test User",
                Email = "test@example.com",
                Role = "User",
                PasswordHash = Convert.ToBase64String(passwordHash),
                PasswordSalt = Convert.ToBase64String(passwordSalt)
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var userDto = new UserDto
            {
                Email = "test@example.com",
                Password = password
            };

            // Act
            var result = await _controller.Login(userDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            var response = okResult.Value as dynamic;
            Assert.That(response.token, Is.Not.Null);
            Assert.That(response.user, Is.Not.Null);
            Assert.That(response.user.email, Is.EqualTo("test@example.com"));
        }

        private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using (var hmac = new HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }

        [Test]
        public async Task Login_WithInvalidEmail_ReturnsBadRequest()
        {
            // Arrange
            var userDto = new UserDto
            {
                Email = "nonexistent@example.com",
                Password = "TestPassword123!"
            };

            // Act
            var result = await _controller.Login(userDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result.Result as BadRequestObjectResult;
            Assert.That(badRequestResult.Value, Is.EqualTo("User not found"));
        }

        [Test]
        public async Task Login_WithInvalidPassword_ReturnsBadRequest()
        {
            // Arrange
            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Test User",
                Email = "test@example.com",
                Role = "User",
                PasswordHash = "hash",
                PasswordSalt = "salt"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var userDto = new UserDto
            {
                Email = "test@example.com",
                Password = "WrongPassword123!"
            };

            // Act
            var result = await _controller.Login(userDto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result.Result as BadRequestObjectResult;
            Assert.That(badRequestResult.Value, Is.EqualTo("Wrong password"));
        }
    }
}