using ReimbursementAPI.Repositories;
using ReimbursementAPI.Services;
using ReimbursementAPI.Interfaces;
using Microsoft.Extensions.FileProviders;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Dapper configuration for underscore matching (useful for DBs)
Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

// Configuration toggle for Mock vs Real DB removed
Console.WriteLine("=== USING REAL MSSQL REPOSITORIES ===");
builder.Services.AddSingleton<IDbConnectionFactory, SqlConnectionFactory>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IRequestRepository, RequestRepository>();
builder.Services.AddScoped<IMyFilesRepository, MyFilesRepository>();
builder.Services.AddScoped<IVehicleKYCRepository, VehicleKYCRepository>();

// Services

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRequestService, RequestService>();
builder.Services.AddScoped<IMyFilesService, MyFilesService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();
app.UseCors("AllowAll");

// Serve standard wwwroot files
app.UseStaticFiles();

// Serve files from configured path (e.g., D:/Reimbursement)
var fileStoragePath = builder.Configuration["FileStorage:BasePath"] ?? "D:/Reimbursement";
try
{
    if (!Directory.Exists(fileStoragePath))
    {
        Directory.CreateDirectory(fileStoragePath);
    }
}
catch (DirectoryNotFoundException)
{
    // Fallback if the drive (e.g. D:/) does not exist on this machine
    fileStoragePath = Path.Combine(builder.Environment.ContentRootPath, "ReimbursementUploads");
    if (!Directory.Exists(fileStoragePath))
    {
        Directory.CreateDirectory(fileStoragePath);
    }
    Console.WriteLine($"WARNING: Configured path not found. Falling back to {fileStoragePath}");
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(fileStoragePath),
    RequestPath = "/user-files",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "*");
    }
});

app.UseAuthorization();
app.MapControllers();

app.Run();
